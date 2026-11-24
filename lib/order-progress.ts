export type OrderProgress = { label: string; step: 0 | 1 | 2 | 3 | 4 };

export function orderProgress(paymentStatus: string, fulfillment: string | null | undefined, receivedAt?: string | null): OrderProgress {
  if (paymentStatus === "cancelled") return { label: "Cancelled", step: 0 };
  if (paymentStatus !== "paid" && paymentStatus !== "captured") return { label: "Payment pending", step: 0 };
  if (fulfillment === "dispatched") return { label: receivedAt ? "Delivered" : "Dispatched", step: 4 };
  if (fulfillment === "collected") return { label: "Collected", step: 4 };
  if (fulfillment === "completed") return { label: "Ready to send", step: 3 };
  if (fulfillment === "ready" || fulfillment === "ready_for_pickup") return { label: "Ready to send", step: 3 };
  if (["yarn_selected", "crocheting", "quality_check", "preparing"].includes(fulfillment || ""))
    return { label: "Making", step: 2 };
  return { label: "Confirmed", step: 1 };
}

export function canMarkReceived(paymentStatus: string, fulfillment: string | null | undefined, receivedAt?: string | null) {
  return paymentStatus === "paid" && fulfillment === "dispatched" && !receivedAt;
}
