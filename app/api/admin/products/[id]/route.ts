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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (resp) {
    return resp as Response;
  }

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const updateRow: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim().slice(0, 200);
    if (!name) return Response.json({ error: "name cannot be empty" }, { status: 400 });
    updateRow.name = name;
  }
  if (body.price !== undefined) {
    const price = typeof body.price === "number" ? body.price : null;
    if (price === null || price <= 0) return Response.json({ error: "price must be positive" }, { status: 400 });
    updateRow.price = price;
  }
  if (typeof body.category === "string") {
    const category = body.category.trim();
    if (!ALLOWED_CATEGORIES.has(category)) {
      return Response.json({ error: `category must be one of: ${[...ALLOWED_CATEGORIES].join(", ")}` }, { status: 400 });
    }
    updateRow.category = category;
  }
  if (typeof body.short_description === "string") updateRow.short_description = body.short_description.trim().slice(0, 500);
  if (typeof body.full_description === "string") updateRow.full_description = body.full_description.trim().slice(0, 4000);
  if (body.processing_time_days !== undefined) {
    const v = typeof body.processing_time_days === "number" ? body.processing_time_days : null;
    if (v === null || v < 0) return Response.json({ error: "processing_time_days must be >= 0" }, { status: 400 });
    updateRow.processing_time_days = v;
  }
  if (body.stock_quantity !== undefined) {
    if (body.stock_quantity === null) {
      updateRow.stock_quantity = null;
    } else {
      const v = typeof body.stock_quantity === "number" ? body.stock_quantity : null;
      if (v === null || v < 0) return Response.json({ error: "stock_quantity must be >= 0" }, { status: 400 });
      updateRow.stock_quantity = v;
    }
  }
  if (body.is_available !== undefined) updateRow.is_available = body.is_available !== false;
  if (body.active !== undefined) updateRow.is_available = body.active !== false;

  if (Object.keys(updateRow).length > 0) {
    const { error } = await supabase
      .from("products")
      .update(updateRow)
      .eq("product_id", id)
      .select()
      .single();

    if (error) {
      console.error("ADMIN PRODUCT UPDATE ERROR:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  if (Array.isArray(body.colors)) {
    await supabase.from("product_colors").delete().eq("product_id", id);
    const rows = body.colors
      .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      .slice(0, 24)
      .map((color_name) => ({
        product_id: id,
        color_name: color_name.trim().slice(0, 80),
      }));
    if (rows.length > 0) {
      const { error } = await supabase.from("product_colors").insert(rows);
      if (error) console.error("ADMIN COLORS INSERT ERROR:", error);
    }
  }

  if (Array.isArray(body.images) || typeof body.image_url === "string") {
    await supabase.from("product_images").delete().eq("product_id", id);
    const primaryImage = typeof body.image_url === "string" ? body.image_url.trim() : null;
    const images = Array.isArray(body.images) ? body.images : [];
    const list = primaryImage ? [primaryImage, ...images.filter((u): u is string => typeof u === "string" && u !== primaryImage)] : images;
    const rows = list
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .slice(0, 12)
      .map((image_url, idx) => ({
        product_id: id,
        image_url: image_url.trim().slice(0, 1000),
        display_order: idx,
      }));
    if (rows.length > 0) {
      const { error } = await supabase.from("product_images").insert(rows);
      if (error) console.error("ADMIN IMAGES INSERT ERROR:", error);
    }
  }

  const { data: final, error: readErr } = await supabase
    .from("products")
    .select("*")
    .eq("product_id", id)
    .single();

  if (readErr) return Response.json({ error: readErr.message }, { status: 500 });
  return Response.json(final);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (resp) {
    return resp as Response;
  }

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("products").delete().eq("product_id", id);
  if (error) {
    console.error("ADMIN PRODUCT DELETE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}