import assert from "node:assert/strict";
import test from "node:test";
import { paymentFromWebhook } from "../lib/razorpay-webhook";

test("only supported payment events with provider identifiers can settle an order", () => {
  assert.deepEqual(paymentFromWebhook({ event: "payment.captured", payload: { payment: { entity: {
    id: "pay_abc123", order_id: "order_abc123" } } } }), { paymentId: "pay_abc123", orderId: "order_abc123" });
  assert.equal(paymentFromWebhook({ event: "payment.failed", payload: {} }), null);
  assert.throws(() => paymentFromWebhook({ event: "payment.authorized", payload: { payment: { entity: {
    id: "bad", order_id: "order_abc123" } } } }), /payment event/i);
});
