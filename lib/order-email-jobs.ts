import "server-only";
import { adminDatabase } from "./supabase-admin";
import { OrderEmailOrder } from "./order-email";
import { ResendResponseError, sendOrderEmail } from "./resend";

type EmailJob = {
  id: string;
  event_key: string;
  kind: "order_confirmation" | "order_completion";
  recipient: string;
  payload: OrderEmailOrder;
};

export async function dispatchOrderEmails(limit = 10) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return { sent: 0, pendingConfiguration: true };
  const db = adminDatabase();
  const repair = await db.rpc("shop_repair_order_emails");
  if (repair.error) throw repair.error;
  const { data, error } = await db.rpc("shop_claim_order_emails", { p_limit: limit });
  if (error) throw error;
  let sent = 0;
  for (const job of (data || []) as EmailJob[]) {
    try {
      const kind = job.kind === "order_confirmation" ? "confirmation" : "completion";
      const payload = { ...job.payload, registeredEmail: job.recipient };
      const providerId = await sendOrderEmail(kind, payload, job.event_key);
      const { error: updateError } = await db.from("notification_jobs")
        .update({ status: "sent", sent_at: new Date().toISOString(), provider_id: providerId, last_error: null })
        .eq("id", job.id).eq("status", "sending");
      if (updateError) throw updateError;
      sent++;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Email send failed.";
      const retryable = error instanceof ResendResponseError && [400, 401, 403, 429].includes(error.status);
      await db.from("notification_jobs").update({
        status: retryable ? "failed" : "sending",
        last_error: message,
        next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }).eq("id", job.id).eq("status", "sending");
      console.error(`Order email ${job.event_key}: ${message}`);
    }
  }
  return { sent, pendingConfiguration: false };
}
