import { createClient } from "@supabase/supabase-js";
import { products } from "../lib/catalog";
import { journal } from "../lib/journal";
import { defaultSettings } from "../lib/site-settings";
import { media } from "../lib/media";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error("Supabase credentials are missing.");
const db = createClient(url, key, { auth: { persistSession: false } });
async function main() {
const assetName = (value: string) => {
  try { return new URL(value).pathname.split("/").at(-1) || ""; } catch { return ""; }
};
const migratedAsset = (oldUrl: unknown, newUrl: string) =>
  typeof oldUrl === "string" && oldUrl.startsWith("https://res.cloudinary.com/") &&
  newUrl.startsWith("https://res.cloudinary.com/") && assetName(oldUrl) === assetName(newUrl) && oldUrl !== newUrl;

for (const product of products) {
  const { data: existing, error: lookupError } = await db.from("products").select("product_id").eq("slug", product.id).maybeSingle();
  if (lookupError) throw lookupError;
  let id = existing?.product_id as string | undefined;
  if (!id) {
    const { data: created, error } = await db.from("products").insert({
    slug: product.id,
    name: product.name,
    short_description: product.note,
    full_description: product.description,
    price: product.price,
    stock_quantity: product.stock,
    processing_time_days: 7,
    category: product.category,
    is_available: true,
    details: product.details,
    display_colors: product.colors,
    }).select("product_id").single();
    if (error) throw error;
    id = created.product_id as string;
  }
  const { data: images, error: imageLookupError } = await db.from("product_images").select("image_id,image_url,display_order").eq("product_id", id);
  if (imageLookupError) throw imageLookupError;
  for (const [index, image_url] of product.gallery.entries()) {
    const previous = (images || []).find((image) => image.display_order === index);
    if (previous && migratedAsset(previous.image_url, image_url)) {
      const { error } = await db.from("product_images").update({ image_url }).eq("image_id", previous.image_id);
      if (error) throw error;
    }
  }
  const missingImages = product.gallery.filter((image_url, index) =>
    !(images || []).some((image) => image.image_url === image_url ||
      (image.display_order === index && migratedAsset(image.image_url, image_url))));
  if (missingImages.length) {
    const { error: imageError } = await db.from("product_images").insert(missingImages.map((image_url) => ({ product_id: id, image_url, display_order: product.gallery.indexOf(image_url), alt_text: product.name })));
    if (imageError) throw imageError;
  }
  console.log(`${existing ? "Checked" : "Added"}: ${product.id}`);
}
const { data: savedSettings, error: settingsError } = await db.from("site_content").select("key,data").eq("key", "settings").maybeSingle();
if (settingsError) throw settingsError;
if (!savedSettings) {
  const { error } = await db.from("site_content").insert({ key: "settings", data: { ...defaultSettings, heroImage: media(defaultSettings.heroImage) } });
  if (error) throw error;
}
else if (migratedAsset(savedSettings.data?.heroImage, media(defaultSettings.heroImage))) {
  const { error } = await db.from("site_content").update({ data: { ...savedSettings.data, heroImage: media(defaultSettings.heroImage) } }).eq("key", "settings");
  if (error) throw error;
}
for (const entry of journal) {
  const { data: saved, error: lookupError } = await db.from("journey").select("slug,data").eq("slug", entry.slug).maybeSingle();
  if (lookupError) throw lookupError;
  if (!saved) {
    const { error } = await db.from("journey").insert({ slug: entry.slug, data: { ...entry, image: media(entry.image) }, published: true });
    if (error) throw error;
  }
  else if (migratedAsset(saved.data?.image, media(entry.image))) {
    const { error } = await db.from("journey").update({ data: { ...saved.data, image: media(entry.image) } }).eq("slug", entry.slug);
    if (error) throw error;
  }
}
console.log("Existing Campus Crochet catalogue is present in Supabase.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
