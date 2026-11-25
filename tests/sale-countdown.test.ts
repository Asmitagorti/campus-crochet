import assert from "node:assert/strict";
import test from "node:test";
import { saleCountdown } from "../lib/sale-countdown";

test("sale countdown carries time across day and minute boundaries", () => {
  const now = Date.parse("2026-11-25T00:00:00.000Z");
  assert.deepEqual(saleCountdown(new Date(now + 90061000).toISOString(), now), {
    days: 1, hours: 1, minutes: 1, seconds: 1,
  });
  assert.deepEqual(saleCountdown(new Date(now + 1).toISOString(), now), {
    days: 0, hours: 0, minutes: 0, seconds: 1,
  });
});

test("sale countdown stops at the deadline and ignores invalid dates", () => {
  const now = Date.parse("2026-11-25T00:00:00.000Z");
  assert.equal(saleCountdown(new Date(now).toISOString(), now), null);
  assert.equal(saleCountdown(new Date(now - 1000).toISOString(), now), null);
  assert.equal(saleCountdown("not-a-date", now), null);
  assert.equal(saleCountdown(null, now), null);
});
