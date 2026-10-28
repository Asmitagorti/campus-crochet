import assert from "node:assert/strict";
import test from "node:test";
import { resolveCheckoutItems } from "../lib/checkout-items";
import type { Product } from "../lib/catalog";

const product = { id: "bunny", databaseId: "11111111-1111-1111-1111-111111111111", price: 299,
  stock: 4, active: true } as Product;

test("resolves a bag to trusted database products and quantity", () => {
  assert.deepEqual(resolveCheckoutItems([{ id: "bunny", quantity: 2 }], [product]),
    [{ productId: product.databaseId, quantity: 2, color: "Default", price: 299 }]);
});

test("rejects duplicate or unavailable product lines before quoting", () => {
  assert.throws(() => resolveCheckoutItems([{ id: "bunny", quantity: 1 }, { id: "bunny", quantity: 1 }], [product]), /quantit/i);
  assert.throws(() => resolveCheckoutItems([{ id: "other", quantity: 1 }], [product]), /quantit/i);
  assert.throws(() => resolveCheckoutItems([{ id: "bunny", quantity: 5 }], [product]), /quantit/i);
});
