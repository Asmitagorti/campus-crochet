export type OrderItem = { id: string; databaseId: string; name: string; quantity: number; price: number };
export type OrderRow = {
  id: string;
  receipt: string;
  token: string;
  userId: string;
  fingerprint: string;
  customer: Record<string, unknown>;
  items: OrderItem[];
  amount: number;
  subtotalPaise: number;
  postagePaise: number;
  deliveryPaise: number;
  deliveryChoice: string;
  deliveryAddress: string;
  deliveryPin: string;
  status: "paid" | "pending" | "cancelled";
  fulfillment: string;
  provider_id: string | null;
  payment_id: string | null;
  created_at: string;
  version: number;
};

export function mapOrderRow(row: Record<string, unknown>): OrderRow {
  const customer = row.customer_snapshot && typeof row.customer_snapshot === "object" ? row.customer_snapshot as Record<string, unknown> : {};
  return {
    id: String(row.order_id),
    receipt: String(row.receipt_number || row.order_id),
    token: String(row.checkout_key || ""),
    userId: String(row.user_id),
    fingerprint: String(row.checkout_fingerprint || ""),
    customer,
    items: ((row.order_items || []) as Record<string, unknown>[]).map((item) => {
      const product = item.products && typeof item.products === "object" ? item.products as Record<string, unknown> : {};
      return {
        id: String(product.slug || ""),
        databaseId: String(item.product_id || ""),
        name: String(item.product_name_at_purchase || product.name || "Handmade piece"),
        quantity: Number(item.quantity || 0),
        price: Number(item.price_at_purchase || 0),
      };
    }),
    amount: Math.round(Number(row.total_price || 0) * 100),
    subtotalPaise: Number(row.subtotal_paise ?? Math.round(Number(row.total_price || 0) * 100)),
    postagePaise: Number(row.postage_paise || 0),
    deliveryPaise: Number(row.delivery_paise || 0),
    deliveryChoice: String(row.delivery_choice || "Aditya Surampalem"),
    deliveryAddress: String(row.delivery_address || ""),
    deliveryPin: String(row.delivery_pin || ""),
    status: row.payment_status === "captured" ? "paid" : row.order_status === "cancelled" ? "cancelled" : "pending",
    fulfillment: String(row.order_status || "pending"),
    provider_id: typeof row.razorpay_order_id === "string" ? row.razorpay_order_id : null,
    payment_id: typeof row.razorpay_payment_id === "string" ? row.razorpay_payment_id : null,
    created_at: String(row.ordered_at || ""),
    version: Number(row.version || 0),
  };
}
