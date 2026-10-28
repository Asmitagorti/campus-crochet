import { orderById, releaseOrder, markPaid } from "@/lib/order-store";
import { requireUser } from "@/lib/supabase-admin";
import { dispatchOrderEmails } from "@/lib/order-email-jobs";
import { gateway, confirmPayment, GatewayPayment } from "@/lib/razorpay";
import { guard, text, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const user = await requireUser(request);
    const b = await readJsonBody(request),
      row = await orderById(text(b.id, 40));
    if (!row || row.userId !== user.uid || row.token !== b.token) throw Error("Order not found.");
    if (row.status === "paid") return Response.json({ status: "paid" });
    if (row.status === "cancelled")
      return Response.json({ status: "cancelled" });
    if (!row.provider_id) throw Error("This order is still starting.");
    const attempts = await gateway<{ items: GatewayPayment[] }>(
      `orders/${row.provider_id}/payments`,
    );
    const payment = attempts.items.find((p) =>
      ["authorized", "captured"].includes(p.status),
    );
    if (payment) {
      await confirmPayment(row.provider_id, payment.id, row.amount);
      await markPaid(row, payment.id);
      try { await dispatchOrderEmails(5); } catch (error) { console.error("Order email queue unavailable", error); }
      return Response.json({ status: "paid" });
    }
    if (attempts.items.some((p) => !["failed", "refunded"].includes(p.status)) ||
      (!attempts.items.length && Date.now() - new Date(row.created_at).getTime() < 2 * 60 * 1000))
      return Response.json({ status: "pending" });
    await releaseOrder(row.id);
    return Response.json({ status: "cancelled" });
  } catch (e) {
    return errorResponse(e);
  }
}
