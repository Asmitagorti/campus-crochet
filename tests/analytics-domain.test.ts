import { test } from "node:test";
import { strict as assert } from "node:assert";
import { clampActiveSeconds, parseVisitorCookie, signVisitorCookie } from "../lib/analytics-domain";

test("activity pings cannot claim excessive time", () => {
  assert.equal(clampActiveSeconds(18), 18);
  assert.equal(clampActiveSeconds(900), 30);
  assert.equal(clampActiveSeconds(-1), 0);
  assert.equal(clampActiveSeconds("30"), 0);
});

test("visitor cookies require a valid signature", () => {
  const id = "140f7952-186d-4819-8d9f-5b2482eca305";
  const key = "a-private-test-secret";
  const cookie = signVisitorCookie(id, key);
  assert.equal(parseVisitorCookie(cookie, key), id);
  assert.equal(parseVisitorCookie(cookie.replace("140f", "140e"), key), null);
  assert.equal(parseVisitorCookie(cookie, "wrong-secret"), null);
});
