import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_CATEGORIES = new Set([
  "Scrunchies",
  "Keychains",
  "Charms",
  "Bookmarks",
  "Bags",
  "Home",
  "Bookmark",
  "Custom",
]);

function normalizeString(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, max);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (resp) {
    return resp as Response;
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const name = normalizeString(body.name, 200);
  const price = normalizeNumber(body.price);
  const category = normalizeString(body.category, 80);
  const shortDesc = normalizeString(body.short_description ?? body.shortDesc, 500);
  const fullDesc = normalizeString(body.full_description ?? body.description, 4000);
  const processingDays = normalizeNumber(body.processing_time_days);
  const stock = normalizeNumber(body.stock_quantity ?? body.stock);
  const isAvailable = body.is_available === undefined ? body.active === undefined ? true : body.active !== false : body.is_available !== false;

  if (!name || price === null || !category) {
    return Response.json({ error: "name, price and category are required" }, { status: 400 });
  }
  if (price <= 0) return Response.json({ error: "price must be positive" }, { status: 400 });
  if (!ALLOWED_CATEGORIES.has(category)) {
    return Response.json({ error: `category must be one of: ${[...ALLOWED_CATEGORIES].join(", ")}` }, { status: 400 });
  }

  const insertRow: Record<string, unknown> = {
    name,
    price,
    category,
    is_available: isAvailable,
  };
  if (shortDesc) insertRow.short_description = shortDesc;
  if (fullDesc) insertRow.full_description = fullDesc;
  if (processingDays !== null) insertRow.processing_time_days = processingDays;
  if (stock !== null) insertRow.stock_quantity = stock;

  const { data: created, error: createErr } = await supabase
    .from("products")
    .insert(insertRow)
    .select()
    .single();

  if (createErr || !created) {
    console.error("ADMIN PRODUCT CREATE ERROR:", createErr);
    return Response.json({ error: createErr?.message ?? "Failed to create product" }, { status: 500 });
  }

  const productId = (created as { product_id: string }).product_id;

  const colors = Array.isArray(body.colors) ? body.colors : [];
  const colorRows = colors
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    .slice(0, 24)
    .map((color_name) => ({
      product_id: productId,
      color_name: color_name.trim().slice(0, 80),
    }));

  if (colorRows.length > 0) {
    const { error: colorErr } = await supabase.from("product_colors").insert(colorRows);
    if (colorErr) console.error("ADMIN PRODUCT COLORS ERROR:", colorErr);
  }

  const images = Array.isArray(body.images) ? body.images : [];
  const primaryImage = typeof body.image_url === "string" ? body.image_url.trim() : null;
  const imageList = primaryImage ? [primaryImage, ...images.filter((u): u is string => typeof u === "string" && u !== primaryImage)] : images;
  const imageRows = imageList
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    .slice(0, 12)
    .map((image_url, idx) => ({
      product_id: productId,
      image_url: image_url.trim().slice(0, 1000),
      display_order: idx,
    }));

  if (imageRows.length > 0) {
    const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
    if (imgErr) console.error("ADMIN PRODUCT IMAGES ERROR:", imgErr);
  }

  return Response.json(created);
}