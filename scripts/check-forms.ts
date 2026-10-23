import assert from "node:assert/strict";
import { firestore } from "../lib/firebase-admin";
async function main() {
  const response = await fetch("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Integration check",
        email: "integration-check@example.invalid",
        topic: "Something else",
        message: "Temporary contact form integration check.",
        consent: true,
        website: "",
      }),
    }),
    result = await response.json();
  assert.equal(response.status, 201);
  const doc = firestore().doc(`messages/${result.id}`);
  try {
    const saved = await doc.get();
    assert.equal(
      saved.data()?.message,
      "Temporary contact form integration check.",
    );
    console.log("PASS: contact submission is durably saved to Firestore.");
  } finally {
    await doc.delete();
    console.log("Temporary contact message removed.");
  }
  const webhook = await fetch("http://localhost:3000/api/payments/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": "0".repeat(64),
    },
    body: "{}",
  });
  assert.equal(webhook.status, 400);
  console.log("PASS: unsigned/forged webhook cannot confirm a payment.");
  const orders = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(orders.status, 400);
  assert.match((await orders.json()).error, /sign in/i);
  console.log("PASS: unauthenticated checkout cannot create an order.");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
