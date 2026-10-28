import assert from "node:assert/strict";
import test from "node:test";
import { isGoogleOAuthSession } from "../lib/google-auth";

test("accepts a Google OAuth session, including an email-first account linked to Google", () => {
  assert.equal(isGoogleOAuthSession({ provider: "google", providers: ["google"] }, [{ method: "oauth" }]), true);
  assert.equal(isGoogleOAuthSession({ provider: "email", providers: ["email", "google"] }, [{ method: "oauth" }]), true);
});

test("rejects emailed links and other OAuth providers", () => {
  assert.equal(isGoogleOAuthSession({ provider: "email", providers: ["email", "google"] }, [{ method: "magiclink" }]), false);
  assert.equal(isGoogleOAuthSession({ provider: "github", providers: ["github"] }, [{ method: "oauth" }]), false);
  assert.equal(isGoogleOAuthSession({ provider: "google", providers: ["google"] }, undefined), false);
});
