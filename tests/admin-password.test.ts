import assert from "node:assert/strict";
import test from "node:test";
import {
  hashAdminPassword,
  verifyAdminPassword,
  createAdminUnlockToken,
  verifyAdminUnlockToken,
} from "../lib/admin-password";

test("admin password is salted and cannot be replaced by a short password", async () => {
  await assert.rejects(hashAdminPassword("short"), /16 characters/i);
  const first = await hashAdminPassword("a long private passphrase");
  const second = await hashAdminPassword("a long private passphrase");
  assert.notEqual(first, second);
  assert.equal(await verifyAdminPassword("a long private passphrase", first), true);
  assert.equal(await verifyAdminPassword("incorrect private phrase", first), false);
});

test("admin unlock is bound to account, Google session and current password hash", () => {
  const now = 1_800_000_000_000;
  const secret = "s".repeat(64);
  const hash = "stored-hash-one";
  const token = createAdminUnlockToken("owner-id", "session-id", hash, secret, now);
  assert.equal(verifyAdminUnlockToken(token, "owner-id", "session-id", hash, secret, now + 1000), true);
  assert.equal(verifyAdminUnlockToken(token, "other-id", "session-id", hash, secret, now + 1000), false);
  assert.equal(verifyAdminUnlockToken(token, "owner-id", "other-session", hash, secret, now + 1000), false);
  assert.equal(verifyAdminUnlockToken(token, "owner-id", "session-id", "new-password-hash", secret, now + 1000), false);
  assert.equal(verifyAdminUnlockToken(token + "x", "owner-id", "session-id", hash, secret, now + 1000), false);
  assert.equal(verifyAdminUnlockToken(token, "owner-id", "session-id", hash, secret, now + 60 * 60 * 1000 + 1), false);
});
