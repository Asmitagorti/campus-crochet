import { firestore } from "@/lib/firebase-admin";
import { orderById, markPaid, releaseOrder } from "@/lib/database";
import { gateway, confirmPayment, GatewayPayment } from "@/lib/razorpay";
import { Timestamp } from "firebase-admin/firestore";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  const expired = await firestore()
    .collection("payment_reservations")
    .where("expiresAt", "<=", Timestamp.now())
    .limit(50)
    .get();
  let settled = 0,
    released = 0,
    review = 0;
  for (const doc of expired.docs) {
    try {
      const row = await orderById(doc.id);
      if (!row || !["creating", "pending"].includes(row.status)) {
        await doc.ref.delete();
        continue;
      }
      if (!row.provider_id) {
        const results = await gateway<{
          items: { id: string; receipt: string }[];
        }>(`orders?receipt=${encodeURIComponent(row.id)}`);
        const match = results.items.find((o) => o.receipt === row.id);
        if (match) {
          await firestore()
            .doc(`orders/${row.id}`)
            .update({ provider_id: match.id, status: "pending" });
          row.provider_id = match.id;
        } else {
          await releaseOrder(row.id);
          released++;
          continue;
        }
      }
      const payments = await gateway<{ items: GatewayPayment[] }>(
          `orders/${row.provider_id}/payments`,
        ),
        paid = payments.items.find((p) =>
          ["authorized", "captured"].includes(p.status),
        );
      if (paid) {
        await confirmPayment(row.provider_id!, paid.id, row.amount);
        await markPaid(row, paid.id);
        settled++;
      } else if (
        payments.items.every((p) => ["failed", "refunded"].includes(p.status))
      ) {
        await releaseOrder(row.id);
        released++;
      } else review++;
    } catch {
      review++;
    }
  }
  return Response.json({ settled, released, review });
}
