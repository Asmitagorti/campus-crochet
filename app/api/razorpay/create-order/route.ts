import { supabase } from "@/lib/supabase";
import { getSession, isAdmin } from "@/lib/auth";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

async function razorpayRequest(method: string, path: string, body?: unknown) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.description || "Razorpay API error");
  }
  return data;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return Response.json(
      { error: "Payment gateway not configured" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { amount, currency = "INR", receipt, notes } = body as {
    amount?: unknown;
    currency?: unknown;
    receipt?: unknown;
    notes?: unknown;
  };

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  if (typeof receipt !== "string" || receipt.length === 0) {
    return Response.json({ error: "receipt is required" }, { status: 400 });
  }

  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
    return Response.json({ error: "currency must be a 3-letter ISO code" }, { status: 400 });
  }

  if (!notes || typeof notes !== "object") {
    return Response.json({ error: "notes object is required" }, { status: 400 });
  }

  const orderId = typeof (notes as Record<string, unknown>).order_id === "string"
    ? (notes as Record<string, unknown>).order_id as string
    : null;

  if (!orderId) {
    return Response.json({ error: "notes.order_id is required" }, { status: 400 });
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("order_id, user_id, total_price, payment_status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return Response.json(
      { error: orderErr?.message ?? "Order not found" },
      { status: 404 }
    );
  }

  if (order.user_id !== session.id && !isAdmin(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.payment_status !== "pending" && order.payment_status !== "captured") {
    return Response.json(
      { error: `Cannot create payment for order in payment_status '${order.payment_status}'` },
      { status: 400 }
    );
  }

  const expectedPaise = Math.round(Number(order.total_price) * 100);
  if (Math.abs(expectedPaise - Math.round(amount * 100)) > 1) {
    return Response.json(
      { error: "amount does not match order total" },
      { status: 400 }
    );
  }

  try {
    const orderRes = await razorpayRequest("POST", "/orders", {
      amount: expectedPaise,
      currency,
      receipt,
      notes,
    });

    await supabase
      .from("orders")
      .update({ razorpay_order_id: orderRes.id })
      .eq("order_id", orderId);

    return Response.json({
      order_id: orderRes.id,
      amount: orderRes.amount,
      currency: orderRes.currency,
      key_id: RAZORPAY_KEY_ID,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Razorpay error";
    console.error("RAZORPAY ORDER ERROR:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}