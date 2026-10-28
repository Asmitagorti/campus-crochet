import { randomUUID } from "node:crypto";
import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { sameOrigin, errorResponse } from "@/lib/forms";
import { readLimitedBody } from "@/lib/request-body";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAdminAccess(request);
    if (Number(request.headers.get("content-length") || 0) > 4300000)
      throw Error("Please use a photo smaller than 4 MB.");
    if (!sameOrigin(request)) throw Error("Invalid upload origin.");
    const payload = await readLimitedBody(request, 4300000, "Please use a photo smaller than 4 MB.");
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") || "" },
      body: payload.buffer,
    }).formData(),
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
      (file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8) ||
      (file.type === "image/png" && bytes.toString("ascii", 1, 4) === "PNG") ||
      (file.type === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") ||
      (file.type === "image/avif" && bytes.toString("ascii", 4, 8) === "ftyp");
    if (!valid) throw Error("This file does not look like a supported image.");
    const purpose = form.get("purpose");
    if (purpose !== null && purpose !== "poll") throw Error("Invalid photo destination.");
    const path = `${purpose === "poll" ? "poll" : "admin"}/${randomUUID()}.${file.type === "image/jpeg" ? "jpg" : file.type.slice(6)}`;
    const bucket = adminDatabase().storage.from("product_images");
    const { error } = await bucket.upload(path, bytes, {
      contentType: file.type, cacheControl: "31536000", upsert: false,
    });
    if (error) throw Error("The photo could not be uploaded. Please try again.");
    return Response.json({
      url: bucket.getPublicUrl(path).data.publicUrl,
      path,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
