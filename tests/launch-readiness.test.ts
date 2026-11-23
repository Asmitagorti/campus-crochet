import assert from "node:assert/strict";
import test from "node:test";
import { launchReadiness } from "../lib/launch-readiness";

test("opening the public shop requires live payments, email and payment recovery", () => {
  const configured = { RAZORPAY_KEY_ID: "rzp_live_example", RAZORPAY_KEY_SECRET: "secret",
    RAZORPAY_WEBHOOK_SECRET: "a".repeat(32), RESEND_API_KEY: "resend", RESEND_FROM_EMAIL: "support@campus-crochet.tech", CRON_SECRET: "b".repeat(32) };
  assert.equal(launchReadiness(configured).ready, true);
  assert.equal(launchReadiness({ ...configured, RAZORPAY_KEY_ID: "rzp_test_example" }).ready, false);
  assert.equal(launchReadiness({ ...configured, RAZORPAY_WEBHOOK_SECRET: "" }).ready, false);
});
