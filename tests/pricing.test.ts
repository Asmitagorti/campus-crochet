import assert from "node:assert/strict";
import test from "node:test";
import { effectiveProductPrice } from "../lib/pricing";

test("an active opening discount becomes the payable price", () => {
  assert.deepEqual(effectiveProductPrice(599, 499, true), { price: 499, regularPrice: 599 });
  assert.deepEqual(effectiveProductPrice(599, 499, false), { price: 599, regularPrice: null });
  assert.deepEqual(effectiveProductPrice(599, null, true), { price: 599, regularPrice: null });
});

test("invalid or higher discounted prices never become payable", () => {
  assert.deepEqual(effectiveProductPrice(599, 699, true), { price: 599, regularPrice: null });
  assert.deepEqual(effectiveProductPrice(599, 0, true), { price: 599, regularPrice: null });
});
