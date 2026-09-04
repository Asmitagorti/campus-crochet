import { createHmac, timingSafeEqual } from "crypto";
import { supabase, getServiceRoleClient } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!RAZORPAY_KEY_SECRET) {
    console.error("RAZORPAY_KEY_SECRET is not configured");
    return Response.json(
      { error: "Payment gateway not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (typeof razorpay_order_id !== "string" || typeof razorpay_payment_id !== "string" || typeof razorpay_signature !== "string" || typeof order_id !== "string") {
    return Response.json({ error: "Invalid field types" }, { status: 400 });
  }

  const generatedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const sigBuf = Buffer.from(razorpay_signature, "utf-8");
  const genBuf = Buffer.from(generatedSignature, "utf-8");

  if (sigBuf.length !== genBuf.length || !timingSafeEqual(sigBuf, genBuf)) {
    console.error("RAZORPAY SIGNATURE MISMATCH");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  const { data: order, error: orderErr } = await db
    .from("orders")
    .select("order_id, user_id, payment_status, razorpay_order_id")
    .eq("order_id", order_id)
    .maybeSingle();

  if (orderErr || !order) {
    return Response.json(
      { error: orderErr?.message ?? "Order not found" },
      { status: 404 }
    );
  }

  if (order.user_id !== session.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
    return Response.json(
      { error: "razorpay_order_id mismatch" },
      { status: 400 }
    );
  }

  if (order.payment_status === "captured") {
    return Response.json({ success: true, message: "Payment already verified" });
  }

  const { error } = await db
    .from("orders")
    .update({
      payment_status: "captured",
      order_status: "payment_received",
      razorpay_order_id,
      razorpay_payment_id,
    })
    .eq("order_id", order_id);

  if (error) {
    console.error("ORDER UPDATE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, message: "Payment verified" });
}