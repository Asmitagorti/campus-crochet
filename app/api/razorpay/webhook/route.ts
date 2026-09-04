import { createHmac } from "crypto";
import { supabase } from "@/lib/supabase";

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

  if (generatedSignature !== signature) {
    console.error("WEBHOOK SIGNATURE MISMATCH");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; notes?: { order_id?: string } } } } };
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

    if (orderId && paymentId) {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "captured",
          order_status: "payment_received",
          razorpay_payment_id: paymentId,
        })
        .eq("order_id", orderId);

      if (error) {
        console.error("WEBHOOK ORDER UPDATE ERROR:", error);
      }
    }
  }

  return Response.json({ received: true });
}