import assert from "node:assert/strict";
import test from "node:test";
import { mapOrderRow } from "../lib/order-row";

test("maps captured Supabase order and keeps the account owner and receipt", () => {
  const order = mapOrderRow({
    order_id: "uuid", user_id: "owner", receipt_number: "CC-ABC", checkout_key: "key",
    total_price: 499, payment_status: "captured", order_status: "payment_received",
    razorpay_order_id: "order_123", razorpay_payment_id: "pay_123", customer_snapshot: { name: "Asha", email: "asha@gmail.com" },
    ordered_at: "2026-10-27T00:00:00Z", version: 1,
    order_items: [{ product_id: "product-uuid", quantity: 1, price_at_purchase: 499, products: { slug: "bunny", name: "Bunny" } }],
  });
  assert.equal(order.id, "uuid");
  assert.equal(order.receipt, "CC-ABC");
  assert.equal(order.userId, "owner");
  assert.equal(order.status, "paid");
  assert.equal(order.amount, 49900);
  assert.equal(order.items[0].id, "bunny");
});

test("keeps saved subtotal and delivery paise on the receipt", () => {
  const order = mapOrderRow({ order_id: "uuid", user_id: "owner", total_price: 423.50,
    subtotal_paise: 29900, postage_paise: 10950, delivery_paise: 12450,
    delivery_choice: "Others", delivery_pin: "600001", delivery_address: "Flat 2, Chennai",
    order_items: [] });
  assert.equal(order.amount, 42350);
  assert.equal(order.subtotalPaise, 29900);
  assert.equal(order.deliveryPaise, 12450);
  assert.equal(order.deliveryPin, "600001");
});

test("uses the item name saved at purchase even after a product is renamed", () => {
  const order = mapOrderRow({ order_id: "uuid", total_price: 299,
    order_items: [{ product_id: "p1", quantity: 1, price_at_purchase: 299,
      product_name_at_purchase: "Original bunny", products: { slug: "bunny", name: "Renamed bunny" } }] });
  assert.equal(order.items[0].name, "Original bunny");
});
