import assert from "node:assert/strict";
import test from "node:test";
import { canMarkReceived, orderProgress } from "../lib/order-progress";

test("paid order begins at confirmed", () => {
  assert.deepEqual(orderProgress("paid", null), { label: "Confirmed", step: 1 });
});

test("fulfillment advances through preparing and completed", () => {
  assert.deepEqual(orderProgress("paid", "preparing"), { label: "Making", step: 2 });
  assert.deepEqual(orderProgress("paid", "completed"), { label: "Ready to send", step: 3 });
});

test("legacy collected orders appear completed and unpaid orders do not progress", () => {
  assert.deepEqual(orderProgress("paid", "collected"), { label: "Collected", step: 4 });
  assert.deepEqual(orderProgress("cancelled", null), { label: "Cancelled", step: 0 });
});

test("Supabase captured payments and quality checks count as in progress", () => {
  assert.deepEqual(orderProgress("captured", "quality_check"), { label: "Making", step: 2 });
  assert.deepEqual(orderProgress("paid", "dispatched"), { label: "Dispatched", step: 4 });
});

test("a delivered parcel completes the existing fourth customer stage", () => {
  assert.deepEqual(orderProgress("paid", "dispatched", "2026-11-24T00:00:00Z"), { label: "Delivered", step: 4 });
  assert.equal(canMarkReceived("paid", "dispatched", null), true);
  assert.equal(canMarkReceived("paid", "dispatched", "2026-11-24T00:00:00Z"), false);
  assert.equal(canMarkReceived("pending", "dispatched", null), false);
  assert.equal(canMarkReceived("paid", "crocheting", null), false);
});
