export function deliveryChargePaise(subtotalPaise: number, homeDelivery: boolean): number {
  if (!Number.isSafeInteger(subtotalPaise) || subtotalPaise < 0) throw Error("Invalid order subtotal.");
  void homeDelivery;
  return 0;
}

type QuotedAmounts = {
  subtotalPaise: number;
  postagePaise: number;
  deliveryPaise: number;
  totalPaise: number;
};

export function verifyDeliveryQuote<T extends QuotedAmounts>(quote: T, homeDelivery: boolean): T {
  const expectedDelivery = deliveryChargePaise(quote.subtotalPaise, homeDelivery);
  if (quote.postagePaise !== 0 || quote.deliveryPaise !== expectedDelivery ||
      quote.totalPaise !== quote.subtotalPaise + expectedDelivery ||
      !Number.isSafeInteger(quote.totalPaise)) {
    throw Error("Delivery setup is out of date. Please contact support before paying.");
  }
  return quote;
}
