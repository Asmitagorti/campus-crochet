import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const names = [
  "hero.png",
  "stitch.jpg",
  "coaster.jpg",
  "coaster-clean.png",
  "bunny.jpg",
  "bunny-clean.png",
  "minion.jpg",
  "tulips.jpg",
  "tulips-clean.png",
  "beanie.jpg",
  "beanie-clean.png",
  "flowers.jpg",
  "bag.jpg",
  "pastel-bag-clean.png",
  "round-coasters.jpg",
];
const map = JSON.parse(await readFile("lib/media-map.json", "utf8"));
for (const name of names) {
  const source = `/images/${name}`;
  if (map[source]) {
    console.log(`Already uploaded: ${name}`);
    continue;
  }
  const timestamp = Math.floor(Date.now() / 1000),
    folder = "campus-crochet",
    public_id = name.replace(/\.[^.]+$/, "");
  const params = `folder=${folder}&overwrite=false&public_id=${public_id}&timestamp=${timestamp}`;
  const signature = createHash("sha256")
    .update(params + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");
  const data = new FormData();
  data.set("file", new Blob([await readFile(`public/images/${name}`)]), name);
  for (const [key, value] of Object.entries({
    folder,
    overwrite: "false",
    public_id,
    timestamp: String(timestamp),
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
  }))
    data.set(key, value);
  const result = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: data, signal: AbortSignal.timeout(90000) },
  );
  const json = await result.json();
  if (!result.ok)
    throw Error(`Upload failed for ${name}: ${json.error?.message}`);
  map[source] = json.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
  await writeFile("lib/media-map.json", JSON.stringify(map, null, 2) + "\n");
  console.log(`Uploaded: ${name}`);
}
console.log("Cloudinary image migration complete.");
