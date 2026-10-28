import { orderById, markPaid } from "@/lib/order-store";
import { requireUser } from "@/lib/supabase-admin";
import { dispatchOrderEmails } from "@/lib/order-email-jobs";
import { verifySignature, razorpayKeys, confirmPayment } from "@/lib/razorpay";
import { guard, text, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const user = await requireUser(request);
    const b = await readJsonBody(request);
    const row = await orderById(text(b.id, 40));
    if (!row || row.userId !== user.uid || row.token !== b.token) throw Error("Order could not be found.");
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
    try { await dispatchOrderEmails(5); } catch (error) { console.error("Order email queue unavailable", error); }
    return Response.json({ id: row.id, status: "paid" });
  } catch (e) {
    return errorResponse(e);
  }
}
