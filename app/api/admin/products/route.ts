import { validImage } from "@/lib/image-url";
import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { loadDraftProducts } from "@/lib/store-data";
import { guard, text, errorResponse } from "@/lib/forms";
import { categories } from "@/lib/catalog";
import { parseProductCategories, productCategoryNames } from "@/lib/product-categories";
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
    if (!Number.isInteger(body.price) || body.price < 1 || body.price > 100000)
      throw Error("Price must be a valid whole number.");
    if (body.discountPrice != null && (!Number.isInteger(body.discountPrice) || body.discountPrice < 1 || body.discountPrice >= body.price))
      throw Error("Discounted price must be a whole number below the regular price.");
    if (body.packedWeightGrams != null && (!Number.isInteger(body.packedWeightGrams) ||
      body.packedWeightGrams < 1 || body.packedWeightGrams > 50000))
      throw Error("Packed weight must be a whole number of grams between 1 and 50,000.");
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
    const products = await loadDraftProducts();
    const chosenCategories = parseProductCategories(body.categories, body.category,
      [...categories.map((item) => item.name), ...products.flatMap(productCategoryNames)]);
    let databaseId: string | null = null;
    if (!body.create) {
      const product = products.find((p) => p.id === slug);
      if (!product?.databaseId) throw Error("Product not found.");
      databaseId = product.databaseId;
    }
    const draftData = { name, description, note, category: chosenCategories[0], categories: chosenCategories,
      price: body.price, discountPrice: body.discountPrice ?? null, packedWeightGrams: body.packedWeightGrams ?? null,
      active: body.active === true, details: body.details, colors: body.colors, gallery: body.gallery };
    const db = adminDatabase();
    if (body.create === true) {
      const { data, error } = await db.from("shop_product_drafts")
        .insert({ slug, data: draftData }).select("draft_id").single();
      if (error) throw error;
      return Response.json({ saved: true, id: data.draft_id });
    }
    const { data, error } = await db.from("shop_product_drafts")
      .update({ data: draftData, revision: body.revision + 1, updated_at: new Date().toISOString() })
      .eq("draft_id", databaseId!).eq("revision", body.revision).select("draft_id").maybeSingle();
    if (error) throw error;
    if (!data) throw Error("This draft changed. Refresh before saving.");
    return Response.json({ saved: true, id: data.draft_id });
  } catch (error) { return errorResponse(error); }
}
