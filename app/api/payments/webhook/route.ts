import { readLimitedBody } from "@/lib/request-body";
import { verifySignature, confirmPayment } from "@/lib/razorpay";
import { paymentFromWebhook } from "@/lib/razorpay-webhook";
import { orderByProvider, markPaid } from "@/lib/order-store";
import { dispatchOrderEmails } from "@/lib/order-email-jobs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook unavailable" }, { status: 503 });
  let body: Uint8Array<ArrayBuffer>;
  try { body = await readLimitedBody(request, 65536, "Payment event too large."); }
  catch { return Response.json({ error: "Invalid payment event" }, { status: 413 }); }
  const raw = new TextDecoder().decode(body);
  if (!verifySignature(body, request.headers.get("x-razorpay-signature") || "", secret))
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  try {
    const event = paymentFromWebhook(JSON.parse(raw));
    if (!event) return Response.json({ accepted: true });
    const order = await orderByProvider(event.orderId);
    if (!order) return Response.json({ accepted: true });
    if (order.status === "paid") return Response.json({ accepted: true });
    if (order.status !== "pending") throw Error("Payment needs manual reconciliation.");
    await confirmPayment(event.orderId, event.paymentId, order.amount);
    await markPaid(order, event.paymentId);
    try { await dispatchOrderEmails(5); }
    catch (error) { console.error("Webhook email queue unavailable", error); }
    return Response.json({ accepted: true });
  } catch (error) {
    console.error("Razorpay webhook processing failed", error);
    return Response.json({ error: "Payment event could not be processed" }, { status: 500 });
  }
}
