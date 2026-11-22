import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "../lib/catalog";
import { belongsToCategory, parseProductCategories, productCategoryNames, visibleCategoryGroups } from "../lib/product-categories";

const product = (name: string, categoryNames: string[], active = true) => ({
  name, category: categoryNames[0], categories: categoryNames, active,
  gallery: [`/${name}.jpg`],
}) as Product;

test("one published product can appear in several categories", () => {
  const bag = product("bag", ["Accessories", "Gifts"]);
  assert.equal(belongsToCategory(bag, "Accessories"), true);
  assert.equal(belongsToCategory(bag, "Gifts"), true);
  assert.equal(belongsToCategory(bag, "Home Decor"), false);
});

test("category lists omit zero-count and hidden-product categories", () => {
  const groups = visibleCategoryGroups([
    product("bag", ["Accessories", "Gifts"]),
    product("bunny", ["Gifts"]),
    product("hidden", ["Home Decor"], false),
  ], ["Home Decor", "Accessories"]);
  assert.deepEqual(groups.map(({ name, count }) => ({ name, count })), [
    { name: "Accessories", count: 1 }, { name: "Gifts", count: 2 },
  ]);
  assert.equal(groups[1].image, "/bag.jpg");
});

test("admin categories accept custom names and reject empty or duplicate choices", () => {
  assert.deepEqual(productCategoryNames({ category: "", categories: [] }), []);
  assert.deepEqual(parseProductCategories(["  Gifts  ", "Home   Decor"], null), ["Gifts", "Home Decor"]);
  assert.deepEqual(parseProductCategories(["gifts"], null, ["Gifts"]), ["Gifts"]);
  assert.deepEqual(parseProductCategories(undefined, "Accessories"), ["Accessories"]);
  for (const invalid of [[], ["All"], ["Gifts", "gifts"], ["<script>"], Array(9).fill("Gifts")]) {
    assert.throws(() => parseProductCategories(invalid, null), /categor/i);
  }
});
