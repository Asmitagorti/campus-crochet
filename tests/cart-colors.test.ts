import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../lib/catalog";
import { cartColorsFor, parseCartColors } from "../lib/cart-colors";

const octopus = { ...products[0], colorOptions: [
  { name: "Blue", hex: "#126bd5", image: "blue.jpg" },
  { name: "Pink", hex: "#f5b2ce", image: "pink.jpg" },
] };

test("saved bag keeps each piece's colour across a quantity change", () => {
  assert.deepEqual(cartColorsFor(octopus, 2, ["Blue", "Pink"]), ["Blue", "Pink"]);
  // After one piece is purchased, the remaining piece keeps the last colour.
  assert.deepEqual(cartColorsFor(octopus, 1, ["Blue", "Pink"]), ["Pink"]);
  assert.deepEqual(cartColorsFor(octopus, 2, null), ["Blue", "Blue"]);
});

test("bag writes reject unknown colours and mismatched piece counts", () => {
  assert.deepEqual(parseCartColors(octopus, 2, ["Blue", "Pink"]), ["Blue", "Pink"]);
  assert.throws(() => parseCartColors(octopus, 1, ["Orange"]), /colours/);
  assert.throws(() => parseCartColors(octopus, 2, ["Blue"]), /colours/);
});
