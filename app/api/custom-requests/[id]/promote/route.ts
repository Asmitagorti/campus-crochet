import { supabase } from "@/lib/supabase";
import { getSession, isAdmin } from "@/lib/auth";

const TABLE = "custom_requests";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await tableExists(TABLE))) {
    return Response.json(
      { error: "custom_requests table not configured" },
      { status: 501 }
    );
  }

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    razorpay_payment_id?: unknown;
    razorpay_order_id?: unknown;
  };

  const razorpayPaymentId =
    typeof body.razorpay_payment_id === "string" && body.razorpay_payment_id.length > 0
      ? body.razorpay_payment_id
      : null;
  const razorpayOrderId =
    typeof body.razorpay_order_id === "string" && body.razorpay_order_id.length > 0
      ? body.razorpay_order_id
      : null;

  if (!razorpayPaymentId && !isAdmin(session)) {
    return Response.json(
      { error: "Payment proof required (razorpay_payment_id) to promote request" },
      { status: 402 }
    );
  }

  const { data: cr } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (!cr) return Response.json({ error: "Request not found" }, { status: 404 });

  const row = cr as { user_id: string; status: string; admin_price?: number; item_name: string; name?: string; description?: string; colors?: string };
  if (row.user_id !== session.id && !isAdmin(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (row.status !== "student_accepted" && !isAdmin(session)) {
    return Response.json({ error: `Cannot promote in status '${row.status}'` }, { status: 400 });
  }
  if (!row.admin_price) {
    return Response.json({ error: "Admin price not set" }, { status: 400 });
  }

  const productName = `Custom: ${row.item_name}`;
  let productId: string | null = null;
  const { data: existingProduct } = await supabase
    .from("products")
    .select("product_id")
    .eq("name", productName)
    .maybeSingle();

  if (existingProduct) {
    productId = (existingProduct as { product_id: string }).product_id;
  } else {
    const { data: created, error: createErr } = await supabase
      .from("products")
      .insert({
        name: productName,
        price: row.admin_price,
        category: "Custom",
        full_description: row.description ?? `Custom order for ${row.name}.`,
        is_available: false,
      })
      .select("product_id")
      .single();

    if (createErr || !created) {
      return Response.json(
        { error: createErr?.message ?? "Failed to create product" },
        { status: 500 }
      );
    }
    productId = (created as { product_id: string }).product_id;
  }

  const orderInsert: Record<string, unknown> = {
    user_id: row.user_id,
    total_price: row.admin_price,
    payment_status: "captured",
    order_status: "payment_received",
  };
  if (razorpayOrderId) orderInsert.razorpay_order_id = razorpayOrderId;
  if (razorpayPaymentId) orderInsert.razorpay_payment_id = razorpayPaymentId;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert(orderInsert)
    .select()
    .single();

  if (orderErr || !order) {
    return Response.json(
      { error: orderErr?.message ?? "Failed to create order" },
      { status: 500 }
    );
  }

  const orderId = (order as { order_id: string }).order_id;

  const { error: itemsErr } = await supabase.from("order_items").insert({
    order_id: orderId,
    product_id: productId,
    selected_color: row.colors ?? "Custom",
    quantity: 1,
    price_at_purchase: row.admin_price,
  });

  if (itemsErr) {
    await supabase.from("orders").delete().eq("order_id", orderId);
    return Response.json({ error: itemsErr.message }, { status: 500 });
  }

  await supabase.from(TABLE).update({ status: "paid" }).eq("id", id);

  return Response.json({ order_id: orderId, order });
}