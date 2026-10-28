import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { retryTransient } from "./retry-transient.ts";

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error("Supabase server credentials are missing.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = db.storage.from("product_images");
const { data: bucketDetails, error: bucketError } = await db.storage.getBucket("product_images");
if (bucketError || !bucketDetails?.public) throw Error("The product_images bucket must exist and be public.");

const map = JSON.parse(await readFile("lib/media-map.json", "utf8"));
const names = Object.keys(map).map((source) => {
  if (!/^\/images\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp|avif)$/.test(source))
    throw Error(`Unexpected media-map key: ${source}`);
  return source.slice("/images/".length);
});
const urls = new Map();
const sourceFiles = new Map();
for (const name of names) {
  const bytes = await readFile(`public/images/${name}`);
  if (bytes.length > 4 * 1024 * 1024) throw Error(`Image exceeds the admin upload limit: ${name}`);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const extension = name.split(".").at(-1);
  const path = `migrated/${name.slice(0, -(extension.length + 1))}-${digest.slice(0, 16)}.${extension}`;
  const publicUrl = bucket.getPublicUrl(path).data.publicUrl;
  urls.set(name, { path, publicUrl, digest });
  sourceFiles.set(name, bytes);
}

const cloudinary = (value) => typeof value === "string" && value.startsWith("https://res.cloudinary.com/");
function migratedUrl(value) {
  if (!cloudinary(value)) return value;
  const name = decodeURIComponent(new URL(value).pathname.split("/").at(-1) || "");
  const replacement = urls.get(name);
  if (!replacement) throw Error(`No local original for Cloudinary image ${name}`);
  return replacement.publicUrl;
}
function replaceDeep(value) {
  if (typeof value === "string") return migratedUrl(value);
  if (Array.isArray(value)) return value.map(replaceDeep);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, replaceDeep(nested)]));
  return value;
}
function countCloudinary(value) {
  if (typeof value === "string") return Number(cloudinary(value));
  if (Array.isArray(value)) return value.reduce((total, nested) => total + countCloudinary(nested), 0);
  if (value && typeof value === "object")
    return Object.values(value).reduce((total, nested) => total + countCloudinary(nested), 0);
  return 0;
}
async function references() {
  const [images, content, journey] = await Promise.all([
    db.from("product_images").select("image_id,image_url").limit(1000),
    db.from("site_content").select("key,data,revision").limit(1000),
    db.from("journey").select("slug,data,revision").limit(1000),
  ]);
  for (const result of [images, content, journey]) if (result.error) throw result.error;
  return { images: images.data || [], content: content.data || [], journey: journey.data || [] };
}
const original = await references();
const activeCloudinary = countCloudinary(original.images.map((row) => row.image_url)) +
  countCloudinary(original.content.map((row) => row.data)) + countCloudinary(original.journey.map((row) => row.data));
// Fail before uploads if an active URL has no corresponding original image.
replaceDeep(original.images.map((row) => row.image_url));
replaceDeep(original.content.map((row) => row.data));
replaceDeep(original.journey.map((row) => row.data));
console.log(`${names.length} local assets; ${activeCloudinary} active Cloudinary references.`);
if (!apply) {
  console.log("Dry run only. Pass --apply to upload and switch image URLs.");
  process.exit(0);
}

for (const name of names) {
  const { path, publicUrl, digest } = urls.get(name);
  const bytes = sourceFiles.get(name);
  const contentType = /\.png$/.test(name) ? "image/png" : /\.webp$/.test(name) ? "image/webp" : /\.avif$/.test(name) ? "image/avif" : "image/jpeg";
  const { error } = await bucket.upload(path, bytes, { contentType, cacheControl: "31536000", upsert: false });
  if (error && String(error.statusCode) !== "409" && !/already exists|duplicate/i.test(error.message)) throw error;
  const saved = await retryTransient(async () => {
    const response = await fetch(publicUrl, { cache: "no-store", signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`Public image check failed for ${name}: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  });
  if (createHash("sha256").update(saved).digest("hex") !== digest)
    throw Error(`Uploaded bytes did not match local original: ${name}`);
  console.log(`Verified image ${name}`);
}

for (const row of original.images) {
  if (!cloudinary(row.image_url)) continue;
  const { data, error } = await db.from("product_images").update({ image_url: migratedUrl(row.image_url) })
    .eq("image_id", row.image_id).eq("image_url", row.image_url).select("image_id");
  if (error || data?.length !== 1) throw Error(`Could not switch product image ${row.image_id}: ${error?.message || "changed concurrently"}`);
}
for (const [table, idKey, rows] of [["site_content", "key", original.content], ["journey", "slug", original.journey]]) {
  for (const row of rows) {
    if (!countCloudinary(row.data)) continue;
    const { data, error } = await db.from(table).update({
      data: replaceDeep(row.data), revision: row.revision + 1, updated_at: new Date().toISOString(),
    }).eq(idKey, row[idKey]).eq("revision", row.revision).select(idKey);
    if (error || data?.length !== 1) throw Error(`Could not switch ${table} image: ${error?.message || "changed concurrently"}`);
  }
}
const after = await references();
const remaining = countCloudinary(after.images.map((row) => row.image_url)) +
  countCloudinary(after.content.map((row) => row.data)) + countCloudinary(after.journey.map((row) => row.data));
if (remaining) throw Error(`${remaining} Cloudinary references remain in Supabase. Local manifest was not changed.`);
for (const [source, value] of Object.entries(map)) map[source] = cloudinary(value) ? migratedUrl(value) : value;
await writeFile("lib/media-map.json", JSON.stringify(map, null, 2) + "\n");
console.log(`Migration complete: ${names.length} verified images, ${activeCloudinary} database references switched.`);
