export function paymentFromWebhook(value: unknown): { paymentId: string; orderId: string } | null {
  if (!value || typeof value !== "object") throw Error("Invalid payment event.");
  const event = (value as { event?: unknown }).event;
  if (event !== "payment.authorized" && event !== "payment.captured") return null;
  const entity = (value as { payload?: { payment?: { entity?: unknown } } }).payload?.payment?.entity;
  if (!entity || typeof entity !== "object") throw Error("Invalid payment event.");
  const { id, order_id } = entity as { id?: unknown; order_id?: unknown };
  if (typeof id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(id) ||
      typeof order_id !== "string" || !/^order_[A-Za-z0-9]+$/.test(order_id))
    throw Error("Invalid payment event.");
  return { paymentId: id, orderId: order_id };
}
