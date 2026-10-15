import { requireAdmin } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * POST /api/products/upload — admin only.
 * Accepts multipart form-data (field "file"), stores it in the
 * `product_images` storage bucket, and returns a public URL the client then
 * saves via PUT /api/products/:id. Also used for custom-request references.
 */
export async function POST(req: Request) {
  try {
    const { caller, db } = await requireAdmin(req);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json({ error: "Please choose an image to upload." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Only image files (PNG, JPG, WEBP) are allowed." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "Image must be smaller than 5 MB." }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${caller.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await db.storage.from("product_images").upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      console.error("STORAGE UPLOAD ERROR:", error);
      return Response.json({ error: "Image upload failed. Please try again." }, { status: 500 });
    }
    const { data } = db.storage.from("product_images").getPublicUrl(path);
    return Response.json({ url: data.publicUrl });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("UPLOAD ERROR:", res);
    return Response.json({ error: "Image upload failed. Please try again." }, { status: 500 });
  }
}
