import { supabase, getServiceRoleClient } from "@/lib/supabase";
import { getSession, isAdmin } from "@/lib/auth";
import type { Order, OrderItem, PaymentStatus, OrderLifecycleStatus } from "@/types";

const ALLOWED_PAYMENT_STATUS: PaymentStatus[] = ["pending", "authorized", "captured", "failed", "refunded"];
const ALLOWED_ORDER_STATUS: OrderLifecycleStatus[] = [
  "pending",
  "payment_received",
  "yarn_selected",
  "crocheting",
  "quality_check",
  "ready",
  "completed",
  "cancelled",
];

const MAX_QTY_PER_ITEM = 20;

type IncomingItem = {
  productId: string;
  color?: string;
  quantity: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const status = searchParams.get("order_status");

  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (userId && userId !== session.id && !isAdmin(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // Admin with no user_id param → return all orders; otherwise scope to the requested/own user
  const effectiveUserId: string | null = isAdmin(session) && !userId ? null : (userId || session.id);

  const db = getServiceRoleClient();
  let query = db
    .from("orders")
    .select(`
      order_id,
      user_id,
      razorpay_order_id,
      razorpay_payment_id,
      payment_status,
      order_status,
      payment_method,
      total_price,
      ordered_at,
      order_items (
        order_item_id,
        order_id,
        product_id,
        selected_color,
        quantity,
        price_at_purchase,
        product:products (
          product_id,
          name,
          price,
          category,
          is_available,
          product_images ( image_id, image_url, display_order ),
          product_colors ( color_id, color_name )
        )
      )
    `)
    .order("order_id", { ascending: false });

  if (effectiveUserId) {
    query = query.eq("user_id", effectiveUserId);
  }
  if (status) {
    query = query.eq("order_status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("SUPABASE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data ?? []).map((row) => {
    const r = row as {
      order_id: string;
      user_id: string;
      razorpay_order_id: string | null;
      razorpay_payment_id: string | null;
      payment_status: PaymentStatus;
      order_status: OrderLifecycleStatus;
      payment_method: string | null;
      total_price: number | string;
      ordered_at?: string | null;
      order_items?: Array<{
        order_item_id: string;
        order_id: string;
        product_id: string;
        selected_color: string | null;
        quantity: number;
        price_at_purchase: number | string | null;
        product?: unknown;
      }> | null;
    };
    const items: OrderItem[] = (r.order_items ?? []).map((it) => {
      const prod = Array.isArray(it.product) ? it.product[0] : it.product;
      const productRow = prod as {
        product_id?: string;
        name?: string;
        price?: number | string;
        category?: string;
        is_available?: boolean | null;
        product_images?: Array<{ image_id: string; image_url: string; display_order: number | null }>;
        product_colors?: Array<{ color_id: string; color_name: string }>;
      } | null;
      const product = productRow?.product_id
        ? {
            id: productRow.product_id,
            name: productRow.name ?? "",
            price: Number(productRow.price ?? 0),
            category: productRow.category ?? "",
            colors: (productRow.product_colors ?? []).map((c) => c.color_name),
            image:
              (productRow.product_images ?? [])
                .slice()
                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url ?? "",
            description: "",
            is_available: productRow.is_available ?? false,
          }
        : undefined;
      return {
        id: it.order_item_id,
        order_id: it.order_id,
        product_id: it.product_id,
        selected_color: it.selected_color ?? "",
        quantity: it.quantity,
        price_at_purchase: Number(it.price_at_purchase ?? 0),
        products: product,
      };
    });

    return {
      id: r.order_id,
      order_id: r.order_id,
      user_id: r.user_id,
      razorpay_order_id: r.razorpay_order_id ?? undefined,
      razorpay_payment_id: r.razorpay_payment_id ?? undefined,
      payment_status: r.payment_status,
      order_status: r.order_status,
      payment_method: r.payment_method ?? undefined,
      total_price: Number(r.total_price),
      ordered_at: r.ordered_at ?? undefined,
      order_items: items,
    } satisfies Order;
  });

  return Response.json(normalized);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Use the authenticated session ID as the user ID — never trust the client.
  const user_id = session.id;
  const items = body.items;
  const razorpay_order_id = body.razorpay_order_id;

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalized: IncomingItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i] as Partial<IncomingItem> | null;
    if (!it || typeof it !== "object") {
      return Response.json({ error: `Item ${i} is malformed` }, { status: 400 });
    }
    const productId = typeof it.productId === "string" ? it.productId : null;
    const color = typeof it.color === "string" ? it.color.trim() : "";
    const quantity = Number(it.quantity);
    if (!productId) return Response.json({ error: `Item ${i} missing productId` }, { status: 400 });
    if (!Number.isFinite(quantity) || quantity < 1) {
      return Response.json({ error: `Item ${i} has invalid quantity` }, { status: 400 });
    }
    if (quantity > MAX_QTY_PER_ITEM) {
      return Response.json(
        { error: `Item ${i} quantity exceeds limit (${MAX_QTY_PER_ITEM})` },
        { status: 400 }
      );
    }
    normalized.push({ productId, color, quantity });
  }

  const db = getServiceRoleClient();

  // Ensure public.users row exists for the authenticated session user
  const { data: existingUser, error: findUserError } = await db
    .from("users")
    .select("user_id")
    .eq("user_id", user_id)
    .maybeSingle();

  if (findUserError) {
    console.error("USER PROFILE CHECK ERROR:", findUserError);
    return Response.json(
      { error: "Failed to verify user profile" },
      { status: 500 }
    );
  }

  if (!existingUser) {
    const { error: createUserError } = await db
      .from("users")
      .insert({
        user_id,
        email: session.email,
      });

    if (createUserError) {
      console.error("USER PROFILE CREATION ERROR:", createUserError);
      return Response.json(
        { error: "Failed to create user profile for order" },
        { status: 500 }
      );
    }
  }

  // Cancel any old unpaid pending orders older than 30 minutes for this user
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await db
    .from("orders")
    .update({
      order_status: "cancelled",
      payment_status: "failed",
    })
    .eq("user_id", user_id)
    .eq("payment_status", "pending")
    .lt("ordered_at", thirtyMinsAgo);

  const productIds = Array.from(new Set(normalized.map((it) => it.productId)));
  const { data: products, error: prodErr } = await db
    .from("products")
    .select("product_id, price, is_available, stock_quantity")
    .in("product_id", productIds);

  if (prodErr) {
    console.error("ORDER PRODUCT LOOKUP ERROR:", prodErr);
    return Response.json({ error: "Failed to load products" }, { status: 500 });
  }

  const priceMap = new Map<string, { price: number; available: boolean; stock: number | null }>();
  for (const p of products ?? []) {
    const row = p as { product_id: string; price: number | string; is_available: boolean | null; stock_quantity: number | null };
    priceMap.set(row.product_id, {
      price: Number(row.price),
      available: row.is_available !== false,
      stock: typeof row.stock_quantity === "number" ? row.stock_quantity : null,
    });
  }

  for (const it of normalized) {
    const info = priceMap.get(it.productId);
    if (!info) {
      return Response.json({ error: `Unknown product: ${it.productId}` }, { status: 400 });
    }
    if (!info.available) {
      return Response.json(
        { error: `Product ${it.productId} is not available` },
        { status: 400 }
      );
    }
    if (info.stock !== null && info.stock < it.quantity) {
      return Response.json(
        { error: `Insufficient stock for ${it.productId}` },
        { status: 400 }
      );
    }
  }

  const serverTotal = normalized.reduce((sum, it) => {
    const info = priceMap.get(it.productId);
    return info ? sum + info.price * it.quantity : sum;
  }, 0);

  const insertRow: Record<string, unknown> = {
    user_id,
    total_price: serverTotal,
    payment_status: "pending",
    order_status: "pending",
  };
  if (typeof razorpay_order_id === "string" && razorpay_order_id.length > 0) {
    insertRow.razorpay_order_id = razorpay_order_id;
  }

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert(insertRow)
    .select()
    .single();

  if (orderError || !order) {
    console.error("ORDER INSERT ERROR:", orderError);
    return Response.json(
      { error: orderError?.message ?? "Failed to create order" },
      { status: 500 }
    );
  }

  const orderId = (order as { order_id: string }).order_id;

  const orderItems = normalized.map((it) => ({
    order_id: orderId,
    product_id: it.productId,
    selected_color: it.color || "Default",
    quantity: it.quantity,
    price_at_purchase: priceMap.get(it.productId)!.price,
  }));

  const { error: itemsError } = await db.from("order_items").insert(orderItems);

  if (itemsError) {
    console.error("ORDER ITEMS INSERT ERROR:", itemsError);
    await db.from("orders").delete().eq("order_id", orderId);
    return Response.json({ error: itemsError.message }, { status: 500 });
  }

  return Response.json({
    order: {
      id: orderId,
      order_id: orderId,
      ...(order as Record<string, unknown>),
    },
    server_total: serverTotal,
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !isAdmin(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const order_id = body.order_id;
  const order_status = body.order_status;
  const payment_status = body.payment_status;

  if (typeof order_id !== "string") {
    return Response.json({ error: "order_id is required" }, { status: 400 });
  }

  const updateRow: Record<string, unknown> = {};
  if (typeof order_status === "string") {
    if (!ALLOWED_ORDER_STATUS.includes(order_status as OrderLifecycleStatus)) {
      return Response.json({ error: `Invalid order_status: ${order_status}` }, { status: 400 });
    }
    updateRow.order_status = order_status;
  }
  if (typeof payment_status === "string") {
    if (!ALLOWED_PAYMENT_STATUS.includes(payment_status as PaymentStatus)) {
      return Response.json({ error: `Invalid payment_status: ${payment_status}` }, { status: 400 });
    }
    updateRow.payment_status = payment_status;
  }
  if (Object.keys(updateRow).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  const { data, error } = await db
    .from("orders")
    .update(updateRow)
    .eq("order_id", order_id)
    .select()
    .single();

  if (error) {
    console.error("ORDER UPDATE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}