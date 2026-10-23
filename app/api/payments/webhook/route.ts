import { orderByProvider, markPaid } from "@/lib/database";
import { verifySignature, confirmPayment } from "@/lib/razorpay";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret)
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  const raw = await request.text();
  if (
    !verifySignature(
      raw,
      request.headers.get("x-razorpay-signature") || "",
      secret,
    )
  )
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    if (!["payment.captured", "order.paid"].includes(event.event))
      return Response.json({ received: true });
    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id || !payment?.id)
      return Response.json({ error: "Missing payment" }, { status: 400 });
    const row = await orderByProvider(payment.order_id);
    if (!row) return Response.json({ error: "Unknown order" }, { status: 404 });
    await confirmPayment(row.provider_id!, payment.id, row.amount);
    await markPaid(row, payment.id);
    return Response.json({ received: true });
  } catch {
    console.error("Payment webhook requires retry");
    return Response.json({ error: "Please retry delivery" }, { status: 500 });
  }
}
