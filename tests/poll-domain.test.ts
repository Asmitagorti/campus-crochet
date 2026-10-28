import assert from "node:assert/strict";
import test from "node:test";
import { parseSiteMode, assertShoppingEnabled, parseBallotOptionIds } from "../lib/poll-domain";

test("unknown mode never permits a new purchase", () => {
  assert.equal(parseSiteMode("shop"), "shop");
  assert.equal(parseSiteMode("poll"), "poll");
  assert.throws(() => parseSiteMode("unknown"), /mode/i);
  assert.throws(() => assertShoppingEnabled("poll"), /unavailable/i);
  assert.throws(() => assertShoppingEnabled("unknown"), /unavailable/i);
});

test("one ballot accepts several distinct option IDs", () => {
  const first = "11111111-1111-4111-8111-111111111111";
  const second = "22222222-2222-4222-8222-222222222222";
  assert.deepEqual(parseBallotOptionIds([first, second]), [first, second]);
  assert.throws(() => parseBallotOptionIds([]), /choose/i);
  assert.throws(() => parseBallotOptionIds([first, first]), /once/i);
  assert.throws(() => parseBallotOptionIds(["not-a-uuid"]), /design/i);
});
