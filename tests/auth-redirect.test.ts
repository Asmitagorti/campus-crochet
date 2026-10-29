import assert from "node:assert/strict";
import test from "node:test";
import { afterGoogleDestination, hasLegacyAuthTokens, isSuccessfulGoogleCallback } from "../lib/auth-redirect";

test("Google sign-in returns to the intended page even when the provider lands at the site root", () => {
  assert.equal(afterGoogleDestination("/vote", false), "/vote");
  assert.equal(afterGoogleDestination("/admin", true), "/admin");
  assert.equal(afterGoogleDestination("/admin", false), "/account");
  assert.equal(afterGoogleDestination("/account", false), "/account");
  assert.equal(afterGoogleDestination("https://evil.example", true), null);
});

test("old token fragments are identified for removal before auth initialization", () => {
  assert.equal(hasLegacyAuthTokens("#access_token=secret&refresh_token=secret"), true);
  assert.equal(hasLegacyAuthTokens("#provider_token=secret"), true);
  assert.equal(hasLegacyAuthTokens("#about"), false);
  assert.equal(hasLegacyAuthTokens(""), false);
});

test("a pending return path is used only after a successful Google callback", () => {
  assert.equal(isSuccessfulGoogleCallback(true, false, true, false), true);
  assert.equal(isSuccessfulGoogleCallback(false, false, true, false), false);
  assert.equal(isSuccessfulGoogleCallback(true, true, true, false), false);
  assert.equal(isSuccessfulGoogleCallback(true, false, false, false), false);
  assert.equal(isSuccessfulGoogleCallback(true, false, true, true), false);
});
