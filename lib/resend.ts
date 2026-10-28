import "server-only";
import { composeOrderEmail, OrderEmailKind, OrderEmailOrder } from "./order-email";

export class ResendResponseError extends Error {
  constructor(public status: number) { super(`Resend rejected the email (${status}).`); }
}

export async function sendOrderEmail(kind: OrderEmailKind, order: OrderEmailOrder, idempotencyKey?: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) throw Error("Resend order email is not configured.");
  const message = composeOrderEmail(kind, order);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey || message.eventKey },
    body: JSON.stringify({ from, to: message.to, reply_to: "support@campus-crochet.tech", subject: message.subject, html: message.html, text: message.text }),
    signal: AbortSignal.timeout(12000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.id !== "string") throw new ResendResponseError(response.status);
  return result.id as string;
}
