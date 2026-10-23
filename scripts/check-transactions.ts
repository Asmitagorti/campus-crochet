import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { firestore } from "../lib/firebase-admin";
import {
  createReservedOrder,
  orderById,
  releaseOrder,
  markPaid,
} from "../lib/database";
import { gateway, verifySignature } from "../lib/razorpay";
async function main() {
  const f = firestore(),
    suffix = randomUUID(),
    id = `check-${suffix}`,
    product = f.doc(`products/${id}`),
    orders: string[] = [],
    keys: string[] = [],
    payment = `pay_check${suffix.replaceAll("-", "")}`;
  await product.create({
    id,
    name: "Transaction check",
    active: true,
    testOnly: true,
    price: 1,
    stock: 1,
    revision: 1,
  });
  const reserve = async () => {
    const order = `TEST-${randomUUID()}`,
      key = randomUUID();
    orders.push(order);
    keys.push(key);
    await createReservedOrder({
      id: order,
      token: "integration-check",
      userId: "integration-check",
      key,
      fingerprint: key,
      customer: { name: "Integration check" },
      items: [{ id, name: "Transaction check", price: 1, quantity: 1 }],
      amount: 100,
    });
    return order;
  };
  try {
    const results = await Promise.allSettled([reserve(), reserve()]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal((await product.get()).data()?.stock, 0);
    console.log("PASS: concurrent requests cannot oversell the final unit.");
    const winner = (
      results.find(
        (r) => r.status === "fulfilled",
      ) as PromiseFulfilledResult<string>
    ).value;
    await Promise.all([releaseOrder(winner), releaseOrder(winner)]);
    assert.equal((await product.get()).data()?.stock, 1);
    console.log("PASS: duplicate cancellations restore stock exactly once.");
    const paidId = await reserve(),
      row = (await orderById(paidId))!;
    await Promise.all([markPaid(row, payment), markPaid(row, payment)]);
    assert.equal((await product.get()).data()?.stock, 0);
    assert.equal((await orderById(paidId))?.status, "paid");
    await releaseOrder(paidId);
    assert.equal((await product.get()).data()?.stock, 0);
    console.log(
      "PASS: repeated payment callbacks are idempotent; paid orders cannot be cancelled.",
    );
    assert.equal(
      verifySignature("order|payment", "0".repeat(64), "test-secret"),
      false,
    );
    console.log("PASS: forged payment signatures are rejected.");
    const remote = await gateway<{
      id: string;
      amount: number;
      currency: string;
      status: string;
    }>("orders", {
      method: "POST",
      body: JSON.stringify({
        amount: 100,
        currency: "INR",
        receipt: `integration-${Date.now()}`,
      }),
    });
    assert.equal(remote.currency, "INR");
    assert.equal(remote.amount, 100);
    assert.equal(remote.status, "created");
    console.log(
      "PASS: Razorpay creates a real test-mode INR order (100 paise). No payment made.",
    );
  } finally {
    const refs = [
      product,
      f.doc(`payments/${payment}`),
      ...orders.flatMap((o) => [
        f.doc(`orders/${o}`),
        f.doc(`payment_reservations/${o}`),
      ]),
      ...keys.map((k) => f.doc(`order_keys/${k}`)),
    ];
    const batch = f.batch();
    for (const ref of refs) batch.delete(ref);
    await batch.commit();
    console.log("Temporary Firestore check records cleaned up.");
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
