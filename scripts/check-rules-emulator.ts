import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
async function main() {
  const env = await initializeTestEnvironment({
    projectId: "demo-campus-crochet",
    firestore: { rules: await readFile("firestore.rules", "utf8") },
  });
  let count = 0;
  try {
    await env.withSecurityRulesDisabled(async (context) => {
      const f = context.firestore();
      await Promise.all([
        setDoc(doc(f, "products/live"), { active: true, stock: 1 }),
        setDoc(doc(f, "products/hidden"), { active: false }),
        setDoc(doc(f, "orders/a"), { userId: "customer-a", status: "paid" }),
        setDoc(doc(f, "orders/b"), { userId: "customer-b", status: "paid" }),
        setDoc(doc(f, "users/customer-a"), { role: "customer" }),
        setDoc(doc(f, "admin_config/singleton"), { uid: "administrator" }),
        setDoc(doc(f, "messages/a"), { message: "private" }),
        setDoc(doc(f, "journey/live"), { published: true }),
        setDoc(doc(f, "journey/draft"), { published: false }),
      ]);
    });
    const guest = env.unauthenticatedContext().firestore(),
      customer = env
        .authenticatedContext("customer-a", {
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
          role: "customer",
        })
        .firestore(),
      admin = env
        .authenticatedContext("administrator", {
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
          role: "admin",
        })
        .firestore(),
      impostor = env
        .authenticatedContext("impostor", {
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
          role: "admin",
        })
        .firestore();
    const checks: [string, () => Promise<unknown>][] = [
      [
        "Published product is public",
        () => assertSucceeds(getDoc(doc(guest, "products/live"))),
      ],
      [
        "Hidden product is private",
        () => assertFails(getDoc(doc(guest, "products/hidden"))),
      ],
      [
        "Guest order read denied",
        () => assertFails(getDoc(doc(guest, "orders/a"))),
      ],
      [
        "Customer own order allowed",
        () => assertSucceeds(getDoc(doc(customer, "orders/a"))),
      ],
      [
        "Other customer order denied",
        () => assertFails(getDoc(doc(customer, "orders/b"))),
      ],
      [
        "Direct stock write denied",
        () =>
          assertFails(updateDoc(doc(customer, "products/live"), { stock: 99 })),
      ],
      [
        "Role escalation denied",
        () =>
          assertFails(
            updateDoc(doc(customer, "users/customer-a"), { role: "admin" }),
          ),
      ],
      [
        "Forged paid order denied",
        () =>
          assertFails(
            setDoc(doc(customer, "orders/forged"), {
              userId: "customer-a",
              status: "paid",
            }),
          ),
      ],
      [
        "Admin claim with wrong singleton denied",
        () => assertFails(getDoc(doc(impostor, "orders/a"))),
      ],
      [
        "Sole admin private read allowed",
        () => assertSucceeds(getDoc(doc(admin, "orders/a"))),
      ],
      [
        "Admin browser stock write denied",
        () =>
          assertFails(updateDoc(doc(admin, "products/live"), { stock: 99 })),
      ],
      [
        "Guest messages denied",
        () => assertFails(getDoc(doc(guest, "messages/a"))),
      ],
      [
        "Admin registry write denied",
        () =>
          assertFails(
            setDoc(doc(admin, "admin_config/singleton"), { uid: "impostor" }),
          ),
      ],
      [
        "Published journey allowed",
        () => assertSucceeds(getDoc(doc(guest, "journey/live"))),
      ],
      [
        "Draft journey denied",
        () => assertFails(getDoc(doc(customer, "journey/draft"))),
      ],
    ];
    for (const [label, check] of checks) {
      await check();
      count++;
      console.log(`PASS: ${label}`);
    }
    assert.equal(count, 15);
    console.log(
      "15 strict security rule checks passed against an isolated emulator.",
    );
  } finally {
    await env.cleanup();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
