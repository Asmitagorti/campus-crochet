import assert from "node:assert/strict";
import test from "node:test";
import { draftProductFromRow, previewCheckoutTotal } from "../lib/shop-drafts";

test("a saved draft product keeps its private catalogue details", () => {
  const result = draftProductFromRow({ draft_id: "sample-id", slug: "blue-bag", revision: 3,
    data: { name: "Blue bag", categories: ["Bags", "Gifts"], description: "Handmade bag",
      note: "A small gift", price: 550, stock: 2, active: true,
      details: [], colors: [], gallery: ["first", "second"] } });
  assert.equal(result.databaseId, "sample-id");
  assert.equal(result.id, "blue-bag");
  assert.deepEqual(result.categories, ["Bags", "Gifts"]);
  assert.deepEqual(result.gallery, ["first", "second"]);
  assert.equal(result.revision, 3);
  assert.equal(result.stock, null);
  assert.equal(result.madeToOrder, true);
});

test("private checkout rehearsal uses the shop delivery threshold and never creates an order", () => {
  assert.deepEqual(previewCheckoutTotal([{ price: 499, quantity: 1 }], "Others"),
    { subtotalPaise: 49900, deliveryPaise: 6900, totalPaise: 56800 });
  assert.deepEqual(previewCheckoutTotal([{ price: 250, quantity: 2 }], "Others"),
    { subtotalPaise: 50000, deliveryPaise: 0, totalPaise: 50000 });
  assert.deepEqual(previewCheckoutTotal([{ price: 250, quantity: 1 }], "Aditya Surampalem"),
    { subtotalPaise: 25000, deliveryPaise: 0, totalPaise: 25000 });
});
