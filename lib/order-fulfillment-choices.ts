export function adminFulfillmentChoices(deliveryChoice: string | null | undefined) {
  return [
    { value: "payment_received", label: "Confirmed" },
    { value: "crocheting", label: "Making" },
    { value: "completed", label: "Ready to send" },
    deliveryChoice === "Others"
      ? { value: "dispatched", label: "Dispatched" }
      : { value: "collected", label: "Collected" },
  ];
}

export function adminFulfillmentSelection(fulfillment: string | null | undefined) {
  if (fulfillment === "dispatched" || fulfillment === "collected") return fulfillment;
  if (fulfillment === "completed" || fulfillment === "ready" || fulfillment === "ready_for_pickup") return "completed";
  if (["yarn_selected", "crocheting", "quality_check", "preparing"].includes(fulfillment || "")) return "crocheting";
  return "payment_received";
}
