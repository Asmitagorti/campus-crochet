import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// PUT /api/products/:id → admin only. Update product + replace colors/images if provided.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const patch: Record<string, unknown> = {};
    for (const k of [
      "name",
      "price",
      "category",
      "short_description",
      "full_description",
      "stock_quantity",
      "processing_time_days",
      "is_available",
    ]) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    if (patch.price !== undefined) patch.price = Number(patch.price);
    if (patch.stock_quantity !== undefined) patch.stock_quantity = Number(patch.stock_quantity);
    if (patch.processing_time_days !== undefined) patch.processing_time_days = Number(patch.processing_time_days);
    if (typeof patch.name === "string") patch.name = patch.name.trim();
    if (patch.price !== undefined && Number(patch.price) < 0) {
      return Response.json({ error: "Price cannot be negative." }, { status: 400 });
    }
    if (patch.stock_quantity !== undefined && Number(patch.stock_quantity) < 0) {
      return Response.json({ error: "Stock cannot be negative." }, { status: 400 });
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await db.from("products").update(patch).eq("product_id", id);
      if (error) {
        console.error("SUPABASE PRODUCT UPDATE ERROR:", error);
        return Response.json({ error: "Could not save the product. Please try again." }, { status: 500 });
      }
    }

    if (Array.isArray(body.colors)) {
      await db.from("product_colors").delete().eq("product_id", id);
      const names = body.colors.filter(Boolean);
      if (names.length > 0) {
        const { error } = await db
          .from("product_colors")
          .insert(names.map((color_name: string) => ({ product_id: id, color_name })));
        if (error) console.error("SUPABASE COLOR REPLACE ERROR:", error);
      }
    }

    if (Array.isArray(body.image_urls)) {
      await db.from("product_images").delete().eq("product_id", id);
      const urls = body.image_urls.filter(Boolean);
      if (urls.length > 0) {
        const { error } = await db
          .from("product_images")
          .insert(urls.map((image_url: string, i: number) => ({ product_id: id, image_url, display_order: i + 1 })));
        if (error) console.error("SUPABASE IMAGE REPLACE ERROR:", error);
      }
    }

    const { data } = await supabase
      .from("products")
      .select("*, product_images(image_id, image_url, display_order), product_colors(color_id, color_name)")
      .eq("product_id", id)
      .single();

    return Response.json(data ?? { product_id: id });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("PRODUCT PUT ERROR:", res);
    return Response.json({ error: "Could not save the product. Please try again." }, { status: 500 });
  }
}

// DELETE /api/products/:id → admin only.
// Products referenced by historical orders are soft-deleted (hidden) so order
// history never breaks; unreferenced products are removed permanently.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await requireAdmin(req);
    const { id } = await params;

    const { data: refs, error: refErr } = await db
      .from("order_items")
      .select("order_id")
      .eq("product_id", id)
      .limit(1);
    if (refErr) {
      console.error("SUPABASE PRODUCT DELETE CHECK ERROR:", refErr);
      return Response.json({ error: "Could not remove the product. Please try again." }, { status: 500 });
    }
    if (refs && refs.length > 0) {
      const { error } = await db.from("products").update({ is_available: false }).eq("product_id", id);
      if (error) {
        console.error("SUPABASE PRODUCT HIDE ERROR:", error);
        return Response.json({ error: "Could not remove the product. Please try again." }, { status: 500 });
      }
      return Response.json({ ok: true, softDeleted: true });
    }

    await db.from("product_images").delete().eq("product_id", id);
    await db.from("product_colors").delete().eq("product_id", id);
    const { error } = await db.from("products").delete().eq("product_id", id);
    if (error) {
      console.error("SUPABASE PRODUCT DELETE ERROR:", error);
      return Response.json({ error: "Could not remove the product. Please try again." }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("PRODUCT DELETE ERROR:", res);
    return Response.json({ error: "Could not remove the product. Please try again." }, { status: 500 });
  }
}
