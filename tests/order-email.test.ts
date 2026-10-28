import assert from "node:assert/strict";
import test from "node:test";
import { composeOrderEmail } from "../lib/order-email";

const order = {
  id: "CC-123",
  registeredEmail: "asha@gmail.com",
  name: "Asha <Rao>",
  address: "Aditya Surampalem",
  items: [{ name: "Flower <Card>", quantity: 2, price: 299 }],
  totalPaise: 59800,
};

test("confirmation includes the order facts and escapes customer data", () => {
  const email = composeOrderEmail("confirmation", order);
  assert.deepEqual(email.to, ["asha@gmail.com"]);
  assert.match(email.subject, /CC-123/);
  for (const detail of ["Flower", "2", "₹299", "₹598", "Aditya Surampalem"])
    assert.ok(email.text.includes(detail));
  assert.ok(email.html.includes("Asha &lt;Rao&gt;"));
  assert.ok(!email.html.includes("<Card>"));
});

test("completion includes status and uses a distinct event key", () => {
  const confirmed = composeOrderEmail("confirmation", order);
  const completed = composeOrderEmail("completion", order);
  assert.match(completed.text, /completed/i);
  assert.notEqual(confirmed.eventKey, completed.eventKey);
});

test("delivery orders show the saved charge and complete destination in both emails", () => {
  const delivery = { ...order, address: "Flat 2, Chennai, Tamil Nadu 600001", subtotalPaise: 59800,
    deliveryPaise: 12450, totalPaise: 72250 };
  for (const kind of ["confirmation", "completion"] as const) {
    const email = composeOrderEmail(kind, delivery);
    assert.match(email.text, /Delivery charge: ₹124\.50/);
    assert.match(email.text, /Total paid: ₹722\.50/);
    assert.match(email.html, /Flat 2, Chennai, Tamil Nadu 600001/);
  }
});
