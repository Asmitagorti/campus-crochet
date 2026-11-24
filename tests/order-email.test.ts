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
  const email = composeOrderEmail(order);
  assert.deepEqual(email.to, ["asha@gmail.com"]);
  assert.match(email.subject, /CC-123/);
  for (const detail of ["Flower", "2", "₹299", "₹598", "Aditya Surampalem"])
    assert.ok(email.text.includes(detail));
  assert.ok(email.html.includes("Asha &lt;Rao&gt;"));
  assert.ok(!email.html.includes("<Card>"));
  assert.match(email.text, /5–7 working days/i);
  assert.match(email.text, /email you personally/i);
  assert.equal(email.eventKey, "campus-crochet/confirmation/CC-123");
});

test("delivery confirmation shows the saved charge and complete destination", () => {
  const delivery = { ...order, address: "Flat 2, Chennai, Tamil Nadu 600001",
    items: [{ name: "Flower <Card>", quantity: 1, price: 299 }],
    subtotalPaise: 29900, deliveryPaise: 6900, totalPaise: 36800 };
  const email = composeOrderEmail(delivery);
  assert.match(email.text, /Delivery charge: ₹69/);
  assert.match(email.text, /Total paid: ₹368/);
  assert.match(email.html, /Flat 2, Chennai, Tamil Nadu 600001/);
});

test("free delivery appears in the confirmation", () => {
  const freeDelivery = { ...order, subtotalPaise: 59800, deliveryPaise: 0 };
  const email = composeOrderEmail(freeDelivery);
  assert.match(email.text, /Delivery charge: Free/);
  assert.match(email.html, /Delivery charge:<\/strong> Free/);
});
