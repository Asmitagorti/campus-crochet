export type OrderProgress = { label: string; step: 0 | 1 | 2 | 3 };

export function orderProgress(paymentStatus: string, fulfillment: string | null | undefined): OrderProgress {
  if (paymentStatus === "cancelled") return { label: "Cancelled", step: 0 };
  if (paymentStatus !== "paid" && paymentStatus !== "captured") return { label: "Payment pending", step: 0 };
  if (fulfillment === "completed" || fulfillment === "collected") return { label: "Completed", step: 3 };
  if (fulfillment === "yarn_selected") return { label: "Yarn selected", step: 2 };
  if (fulfillment === "crocheting") return { label: "Crocheting", step: 2 };
  if (fulfillment === "quality_check") return { label: "Quality check", step: 2 };
  if (fulfillment === "preparing" || fulfillment === "ready" || fulfillment === "ready_for_pickup")
    return { label: fulfillment === "preparing" ? "Preparing" : "Ready", step: 2 };
  return { label: "Confirmed", step: 1 };
}
