import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
export function razorpayKeys() {
  const id = process.env.RAZORPAY_KEY_ID,
    secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret)
    throw Error("Payments are not configured. Please contact the studio.");
  return { id, secret };
}
export async function gateway<T = Record<string, unknown>>(
  endpoint: string,
  init: RequestInit = {},
) {
  const { id, secret } = razorpayKeys();
  const response = await fetch(`https://api.razorpay.com/v1/${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.json();
  if (!response.ok) {
    console.error("Razorpay request failed", response.status, body.error?.code);
    throw Error(
      "The payment service could not start this payment. Please try again or contact the studio.",
    );
  }
  return body as T;
}
export function verifySignature(
  message: string,
  signature: string,
  secret: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export type GatewayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
};
export async function confirmPayment(
  orderId: string,
  paymentId: string,
  amount: number,
) {
  let payment = await gateway<GatewayPayment>(
    `payments/${encodeURIComponent(paymentId)}`,
  );
  if (
    payment.order_id !== orderId ||
    payment.amount !== amount ||
    payment.currency !== "INR"
  )
    throw Error("Payment details did not match this order.");
  if (payment.status === "authorized") {
    try {
      payment = await gateway<GatewayPayment>(
        `payments/${encodeURIComponent(paymentId)}/capture`,
        { method: "POST", body: JSON.stringify({ amount, currency: "INR" }) },
      );
    } catch (error) {
      // The callback and webhook can race to capture the same payment.
      const latest = await gateway<GatewayPayment>(
        `payments/${encodeURIComponent(paymentId)}`,
      );
      if (latest.status !== "captured") throw error;
      payment = latest;
    }
  }
  if (payment.status !== "captured")
    throw Error(
      "Your payment is still being confirmed. Please retry verification in a moment.",
    );
  return payment;
}
