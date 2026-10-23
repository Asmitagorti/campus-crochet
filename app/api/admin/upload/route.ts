import { createHash, randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/firebase-admin";
import { sameOrigin, errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    if (Number(request.headers.get("content-length") || 0) > 4300000)
      throw Error("Please use a photo smaller than 4 MB.");
    if (!sameOrigin(request)) throw Error("Invalid upload origin.");
    const form = await request.formData(),
      file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 4194304 ||
      file.size === 0 ||
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.type,
      )
    )
      throw Error("Upload a JPG, PNG, WebP or AVIF photo under 4 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const valid =
      (bytes[0] === 0xff && bytes[1] === 0xd8) ||
      bytes.toString("ascii", 1, 4) === "PNG" ||
      (bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP") ||
      bytes.toString("ascii", 4, 8) === "ftyp";
    if (!valid) throw Error("This file does not look like a supported image.");
    const cloud = process.env.CLOUDINARY_CLOUD_NAME,
      key = process.env.CLOUDINARY_API_KEY,
      secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret)
      throw Error("Photo uploads are not configured.");
    const timestamp = Math.floor(Date.now() / 1000),
      folder = "campus-crochet",
      public_id = randomUUID(),
      signature = createHash("sha256")
        .update(
          `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${secret}`,
        )
        .digest("hex");
    const upload = new FormData();
    upload.set("file", new Blob([bytes], { type: file.type }), file.name);
    for (const [k, v] of Object.entries({
      folder,
      public_id,
      timestamp: String(timestamp),
      api_key: key,
      signature,
    }))
      upload.set(k, v);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
      { method: "POST", body: upload, signal: AbortSignal.timeout(60000) },
    );
    const result = await response.json();
    if (!response.ok)
      throw Error("The photo could not be uploaded. Please try again.");
    return Response.json({
      url: result.secure_url.replace("/upload/", "/upload/f_auto,q_auto/"),
      publicId: result.public_id,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
