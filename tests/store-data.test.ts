import assert from "node:assert/strict";
import test from "node:test";
import { mapStoreProduct } from "../lib/store-product";

test("Supabase product rows keep the existing storefront shape", () => {
  const result = mapStoreProduct({
    slug: "bunny", name: "Strawberry bunny", category: "Keychains & Charms",
    short_description: "The sweetest little companion", full_description: "Handmade bunny",
    price: 499, stock_quantity: 4, packed_weight_grams: 180, is_available: true, details: [["Includes", "One"]],
    display_colors: ["#f7efdf"], revision: 2,
    product_images: [{ image_url: "second", display_order: 1 }, { image_url: "first", display_order: 0 }],
  });
  assert.equal(result.id, "bunny");
  assert.equal(result.stock, 4);
  assert.equal(result.packedWeightGrams, 180);
  assert.deepEqual(result.gallery, ["first", "second"]);
  assert.deepEqual(result.colors, ["#f7efdf"]);
});
