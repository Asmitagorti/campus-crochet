import { validImage } from "@/lib/image-url";
import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { loadProducts } from "@/lib/store-data";
import { guard, text, errorResponse } from "@/lib/forms";
import { categories } from "@/lib/catalog";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAdminAccess(request);
    await guard(request, 60);
    const body = await readJsonBody(request);
    const slug = text(body.id, 70), name = text(body.name, 100);
    const description = text(body.description, 5000), note = text(body.note, 160);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || name.length < 3 || description.length < 20)
      throw Error("Please provide a valid slug, name and description.");
    if (!Number.isInteger(body.price) || body.price < 1 || body.price > 100000 ||
      !Number.isInteger(body.stock) || body.stock < 0 || body.stock > 100000)
      throw Error("Price and stock must be valid whole numbers.");
    if (body.packedWeightGrams != null && (!Number.isInteger(body.packedWeightGrams) ||
      body.packedWeightGrams < 1 || body.packedWeightGrams > 50000))
      throw Error("Packed weight must be a whole number of grams between 1 and 50,000.");
    if (!categories.some((category) => category.name === body.category)) throw Error("Please select a collection.");
    if (!Array.isArray(body.gallery) || body.gallery.length < 1 || body.gallery.length > 8 || !body.gallery.every(validImage))
      throw Error("Add between one and eight photos from Supabase Storage.");
    if (!Array.isArray(body.colors) || body.colors.length > 8 ||
      !body.colors.every((color: unknown) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)))
      throw Error("Use valid six-digit colour codes.");
    if (!Array.isArray(body.details) || body.details.length > 20 ||
      !body.details.every((detail: unknown) => Array.isArray(detail) && detail.length === 2 &&
        detail.every((value: unknown) => typeof value === "string" && value.length < 400)))
      throw Error("Please check product specifications.");
    if (!Number.isInteger(body.revision) || body.revision < 0) throw Error("Refresh this product before saving.");
    let databaseId: string | null = null;
    if (!body.create) {
      const product = (await loadProducts(true)).find((p) => p.id === slug);
      if (!product?.databaseId) throw Error("Product not found.");
      databaseId = product.databaseId;
    }
    const { data, error } = await adminDatabase().rpc("shop_save_product", {
      p_id: databaseId, p_expected: body.revision,
      p_fields: { slug, name, description, note, category: body.category,
        price: body.price, stock: body.stock, packedWeightGrams: body.packedWeightGrams ?? null, active: body.active === true,
        details: body.details, colors: body.colors },
      p_images: body.gallery,
    });
    if (error) throw error;
    return Response.json({ saved: true, id: data });
  } catch (error) { return errorResponse(error); }
}
