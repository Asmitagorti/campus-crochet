import { createHmac, timingSafeEqual } from "crypto";
import { supabase, getServiceRoleClient } from "@/lib/supabase";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const generatedSignature = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "utf-8");
  const genBuf = Buffer.from(generatedSignature, "utf-8");

  if (sigBuf.length !== genBuf.length || !timingSafeEqual(sigBuf, genBuf)) {
    console.error("WEBHOOK SIGNATURE MISMATCH");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: { order_id?: string } } } } };
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("RAZORPAY WEBHOOK EVENT:", event.event);

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.notes?.order_id;
    const paymentId = payment?.id;
    const razorpayOrderId = payment?.order_id;

    if (orderId && paymentId) {
      const db = getServiceRoleClient();
      const { data: existingOrder } = await db
        .from("orders")
        .select("razorpay_order_id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (!existingOrder?.razorpay_order_id || !razorpayOrderId || existingOrder.razorpay_order_id === razorpayOrderId) {
        const updateData: Record<string, unknown> = {
          payment_status: "captured",
          order_status: "payment_received",
          razorpay_payment_id: paymentId,
        };
        if (razorpayOrderId && !existingOrder?.razorpay_order_id) {
          updateData.razorpay_order_id = razorpayOrderId;
        }

        const { error } = await db
          .from("orders")
          .update(updateData)
          .eq("order_id", orderId);

        if (error) {
          console.error("WEBHOOK ORDER UPDATE ERROR:", error);
        }
      } else {
        console.error("WEBHOOK RAZORPAY ORDER ID MISMATCH:", {
          existing: existingOrder.razorpay_order_id,
          incoming: razorpayOrderId,
        });
      }
    }
  }

  return Response.json({ received: true });
}