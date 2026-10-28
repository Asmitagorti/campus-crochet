import { adminDatabase } from "@/lib/supabase-admin";
import { orderById, markPaid, releaseOrder, claimGateway, attachProvider } from "@/lib/order-store";
import { dispatchOrderEmails } from "@/lib/order-email-jobs";
import { gateway, confirmPayment, GatewayPayment } from "@/lib/razorpay";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  const db = adminDatabase();
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data, error } = await db.from("orders").select("order_id,razorpay_order_id,ordered_at")
    .eq("payment_status", "pending").eq("order_status", "pending")
    .lt("ordered_at", cutoff).order("ordered_at", { ascending: true }).limit(50);
  if (error) throw error;
  let settled = 0, released = 0, review = 0;
  for (const candidate of data || []) {
    try {
      const row = await orderById(candidate.order_id);
      if (!row || row.status !== "pending") continue;
      if (!row.provider_id) {
        if (Date.now() - new Date(row.created_at).getTime() < 30 * 60 * 1000) continue;
        const results = await gateway<{ items: { id: string; receipt: string }[] }>(
          `orders?receipt=${encodeURIComponent(row.id)}`);
        const match = results.items.find((item) => item.receipt === row.id);
        if (!match) { await releaseOrder(row.id); released++; continue; }
        const claim = randomUUID();
        await claimGateway(row.id, claim);
        await attachProvider(row.id, claim, match.id);
        row.provider_id = match.id;
      }
      const payments = await gateway<{ items: GatewayPayment[] }>(`orders/${row.provider_id}/payments`);
      const paid = payments.items.find((item) => ["authorized", "captured"].includes(item.status));
      if (paid) {
        await confirmPayment(row.provider_id!, paid.id, row.amount);
        await markPaid(row, paid.id);
        settled++;
      } else if ((payments.items.length > 0 && payments.items.every((item) => ["failed", "refunded"].includes(item.status))) ||
        (!payments.items.length && Date.now() - new Date(row.created_at).getTime() > 30 * 60 * 1000)) {
        await releaseOrder(row.id);
        released++;
      } else review++;
    } catch (error) { console.error("Payment reconciliation needs review", candidate.order_id, error); review++; }
  }
  let emails: Awaited<ReturnType<typeof dispatchOrderEmails>> | null = null;
  try { emails = await dispatchOrderEmails(20); } catch (error) { console.error("Order email dispatch unavailable", error); }
  return Response.json({ settled, released, review, emails });
}
