import assert from "node:assert/strict";
import test from "node:test";
import { orderProgress } from "../lib/order-progress";

test("paid order begins at confirmed", () => {
  assert.deepEqual(orderProgress("paid", null), { label: "Confirmed", step: 1 });
});

test("fulfillment advances through preparing and completed", () => {
  assert.deepEqual(orderProgress("paid", "preparing"), { label: "Preparing", step: 2 });
  assert.deepEqual(orderProgress("paid", "completed"), { label: "Completed", step: 3 });
});

test("legacy collected orders appear completed and unpaid orders do not progress", () => {
  assert.deepEqual(orderProgress("paid", "collected"), { label: "Completed", step: 3 });
  assert.deepEqual(orderProgress("cancelled", null), { label: "Cancelled", step: 0 });
});

test("Supabase captured payments and quality checks count as in progress", () => {
  assert.deepEqual(orderProgress("captured", "quality_check"), { label: "Quality check", step: 2 });
});
