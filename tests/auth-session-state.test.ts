import assert from "node:assert/strict";
import test from "node:test";
import { checkedSession, sameSignedInAccount } from "../lib/auth-session-state";

const savedUser = { uid: "customer-1", email: "customer@example.com", displayName: "Customer" };

test("a failed account check keeps a restored browser session instead of demanding Google again", () => {
  assert.deepEqual(checkedSession(savedUser, { ok: false, error: "Account check unavailable" }), {
    user: savedUser, admin: false, error: "Account check unavailable",
  });
});

test("a successful check can grant the admin UI only to an approved session", () => {
  assert.deepEqual(checkedSession(savedUser, { ok: true, admin: true }), {
    user: savedUser, admin: true, error: "",
  });
});

test("a token refresh for the same account keeps the admin page visible during recheck", () => {
  assert.equal(sameSignedInAccount("owner-id", "owner-id"), true);
  assert.equal(sameSignedInAccount("owner-id", "different-id"), false);
  assert.equal(sameSignedInAccount("owner-id", null), false);
  assert.equal(sameSignedInAccount(null, "owner-id"), false);
});
