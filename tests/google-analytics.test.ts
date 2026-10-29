import { test } from "node:test";
import { strict as assert } from "node:assert";
import { isTrackablePage, parseGoogleAnalyticsChoice, safePageLocation, shouldLoadGoogleAnalytics } from "../lib/google-analytics";

test("Google Analytics starts by default while respecting a prior opt-out", () => {
  assert.equal(parseGoogleAnalyticsChoice(null), "unset");
  assert.equal(parseGoogleAnalyticsChoice("accepted"), "accepted");
  assert.equal(parseGoogleAnalyticsChoice("declined"), "declined");
  assert.equal(parseGoogleAnalyticsChoice("anything else"), "unset");
  assert.equal(shouldLoadGoogleAnalytics("unset"), true);
  assert.equal(shouldLoadGoogleAnalytics("accepted"), true);
  assert.equal(shouldLoadGoogleAnalytics("declined"), false);
});

test("page URLs sent to Analytics omit sign-in tokens and query details", () => {
  assert.equal(safePageLocation("https://campus-crochet.tech", "/account?code=secret#access_token=secret"), "https://campus-crochet.tech/account");
  assert.equal(safePageLocation("https://campus-crochet.tech", "/"), "https://campus-crochet.tech/");
});

test("private account and payment routes are excluded from Google Analytics", () => {
  assert.equal(isTrackablePage("/"), true);
  assert.equal(isTrackablePage("/vote"), true);
  assert.equal(isTrackablePage("/account"), false);
  assert.equal(isTrackablePage("/admin/orders"), false);
  assert.equal(isTrackablePage("/checkout"), false);
});
