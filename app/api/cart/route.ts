import { supabase } from "@/lib/supabase";
import { getSession, isAdmin } from "@/lib/auth";

const MAX_QTY_PER_ITEM = 20;
const CART_TABLE = "cart_items";

function cartUnavailable() {
  return Response.json(
    {
      error:
        "Cart persistence is not configured in the database. The 'cart_items' table does not exist. Please run the SQL migration to create cart_items (and required custom_requests / profiles tables), then restart the server.",
    },
    { status: 501 }
  );
}

async function tableExists(name: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(name).select("*").limit(0);
    if (!error) return true;
    const msg = error.message?.toLowerCase() ?? "";
    return !msg.includes("does not exist") && !msg.includes("not found");
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await tableExists(CART_TABLE))) {
    return Response.json({ error: "cart_items table not configured", items: [] }, { status: 501 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId || (userId !== session.id && !isAdmin(session))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from(CART_TABLE)
    .select(
      `
      cart_item_id,
      user_id,
      product_id,
      selected_color,
      quantity,
      created_at,
      updated_at,
      product:products (
        product_id,
        name,
        price,
        category,
        is_available,
        product_images ( image_id, image_url, display_order ),
        product_colors ( color_id, color_name )
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    console.error("CART GET ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await tableExists(CART_TABLE))) return cartUnavailable();

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const { user_id, product_id, color, quantity } = body;

  if (typeof user_id !== "string" || typeof product_id !== "string" || typeof color !== "string" || color.trim().length === 0) {
    return Response.json({ error: "user_id, product_id and color are required" }, { status: 400 });
  }
  if (user_id !== session.id && !isAdmin(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const qty = typeof quantity === "number" && quantity > 0 ? Math.floor(quantity) : 1;
  if (qty > MAX_QTY_PER_ITEM) {
    return Response.json({ error: `Quantity exceeds limit (${MAX_QTY_PER_ITEM})` }, { status: 400 });
  }

  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("product_id, is_available")
    .eq("product_id", product_id)
    .maybeSingle();

  if (prodErr) return Response.json({ error: prodErr.message }, { status: 500 });
  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
  if (product.is_available === false) {
    return Response.json({ error: "Product is not available" }, { status: 400 });
  }

  const { data: productColors } = await supabase
    .from("product_colors")
    .select("color_name")
    .eq("product_id", product_id);

  const allowed = new Set((productColors ?? []).map((c) => (c as { color_name: string }).color_name.toLowerCase()));
  if (allowed.size > 0 && !allowed.has(color.trim().toLowerCase())) {
    return Response.json({ error: `Color '${color}' is not available for this product` }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from(CART_TABLE)
    .select("cart_item_id, quantity")
    .eq("user_id", user_id)
    .eq("product_id", product_id)
    .eq("selected_color", color)
    .maybeSingle();

  let data, error;
  if (existing) {
    const newQty = Math.min((existing as { quantity: number }).quantity + qty, MAX_QTY_PER_ITEM);
    ({ data, error } = await supabase
      .from(CART_TABLE)
      .update({ quantity: newQty })
      .eq("cart_item_id", (existing as { cart_item_id: string }).cart_item_id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from(CART_TABLE)
      .insert({ user_id, product_id, selected_color: color, quantity: qty })
      .select()
      .single());
  }

  if (error) {
    console.error("CART INSERT ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await tableExists(CART_TABLE))) return cartUnavailable();

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const { cart_item_id, quantity } = body;
  if (typeof cart_item_id !== "string" || typeof quantity !== "number") {
    return Response.json({ error: "cart_item_id and quantity are required" }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity < 0) {
    return Response.json({ error: "Invalid quantity" }, { status: 400 });
  }
  if (quantity > MAX_QTY_PER_ITEM) {
    return Response.json({ error: `Quantity exceeds limit (${MAX_QTY_PER_ITEM})` }, { status: 400 });
  }

  if (quantity === 0) {
    const { error } = await supabase
      .from(CART_TABLE)
      .delete()
      .eq("cart_item_id", cart_item_id)
      .eq("user_id", session.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  const { data, error } = await supabase
    .from(CART_TABLE)
    .update({ quantity })
    .eq("cart_item_id", cart_item_id)
    .eq("user_id", session.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await tableExists(CART_TABLE))) return cartUnavailable();

  const { searchParams } = new URL(request.url);
  const cartItemId = searchParams.get("cart_item_id");
  const userId = searchParams.get("user_id");

  if (!cartItemId || !userId) {
    return Response.json({ error: "Missing cart_item_id or user_id" }, { status: 400 });
  }
  if (userId !== session.id && !isAdmin(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from(CART_TABLE)
    .delete()
    .eq("cart_item_id", cartItemId)
    .eq("user_id", userId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}