import { orderById, markPaid } from "@/lib/database";
import { verifySignature, razorpayKeys, confirmPayment } from "@/lib/razorpay";
import { guard, text, errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const b = await request.json();
    const row = await orderById(text(b.id, 40));
    if (!row || row.token !== b.token) throw Error("Order could not be found.");
    const paymentId = text(b.razorpay_payment_id, 100);
    if (
      !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
      row.provider_id !== b.razorpay_order_id ||
      !verifySignature(
        `${row.provider_id}|${paymentId}`,
        text(b.razorpay_signature, 100),
        razorpayKeys().secret,
      )
    )
      throw Error(
        "Payment verification failed. Please contact us if you were charged.",
      );
    await confirmPayment(row.provider_id!, paymentId, row.amount);
    await markPaid(row, paymentId);
    return Response.json({ id: row.id, status: "paid" });
  } catch (e) {
    return errorResponse(e);
  }
}
