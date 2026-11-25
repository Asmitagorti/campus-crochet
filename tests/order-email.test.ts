import assert from "node:assert/strict";
import test from "node:test";
import { composeOrderEmail, composeManualEmail, defaultOrderEmailTemplate, defaultShippingEmailTemplate, defaultReceivedEmailTemplate, manualShippingEmail, manualShippingEmailText, parseEmailKind, validateEmailTemplate, validateOrderEmailTemplate } from "../lib/order-email";

const order = {
  id: "CC-123",
  registeredEmail: "asha@gmail.com",
  name: "Asha <Rao>",
  address: "Aditya Surampalem",
  items: [{ name: "Flower <Card>", quantity: 2, price: 299 }],
  totalPaise: 59800,
};

test("default confirmation follows Asmita's message and bolds purchased item names", () => {
  const email = composeOrderEmail(order);
  assert.deepEqual(email.to, ["asha@gmail.com"]);
  assert.ok(!("bcc" in email));
  assert.equal(email.subject, "Yay! Your Campus Crochet order is confirmed! 🧶");
  assert.match(email.text, /Hii Asha <Rao>!/);
  assert.match(email.text, /Your order for Flower <Card> × 2 has officially been placed and received!/);
  assert.match(email.text, /1–2 weeks/);
  assert.match(email.text, /pursuing my B\.Tech/);
  assert.match(email.html, /<strong>Flower &lt;Card&gt; × 2<\/strong>/);
  assert.ok(!email.html.includes("<Card>"));
  assert.match(email.html, /mailto:support@campus-crochet\.tech/);
  assert.match(email.text, /Check your profile regularly for updates/);
  assert.match(email.html, /href="https:\/\/campus-crochet\.tech\/account"/);
  assert.ok(!email.text.includes("Total paid:"));
  assert.ok(!email.text.includes("Order ID:"));
  assert.equal(email.eventKey, "campus-crochet/confirmation/CC-123");
});

test("customer confirmation contains no owner-only details", () => {
  const email = composeOrderEmail({ ...order, registeredEmail: "asmileis4evr@gmail.com" });
  assert.deepEqual(email.to, ["asmileis4evr@gmail.com"]);
  assert.ok(!("bcc" in email));
});

test("a saved template is used for later messages and multiple items remain bold", () => {
  const template = { subject: "A special order from Campus Crochet", body: "Hii {user_name}!\n\nYour {item_name} is confirmed.\n\n**Thank you**" };
  const email = composeOrderEmail({ ...order, items: [order.items[0], { name: "Blue hat", quantity: 1, price: 400 }] }, template);
  assert.equal(email.subject, template.subject);
  assert.match(email.text, /Flower <Card> × 2 and Blue hat/);
  assert.match(email.html, /<strong>Flower &lt;Card&gt; × 2 and Blue hat<\/strong>/);
  assert.match(email.html, /<strong>Thank you<\/strong>/);
  assert.match(email.text, /Check your profile regularly for updates/);
  assert.equal(email.text.match(/Check your profile regularly for updates/g)?.length, 1);
});

test("edited email content cannot inject HTML or unsafe links", () => {
  const template = { subject: "Order confirmed", body: "Hi {user_name}, {item_name}. <script>alert(1)</script> [click](javascript:alert(1))" };
  const email = composeOrderEmail(order, template);
  assert.ok(!email.html.includes("<script>"));
  assert.ok(!email.html.includes('href="javascript:'));
  assert.match(email.html, /&lt;script&gt;/);
});

test("admin email edits require usable placeholders and reject unknown ones", () => {
  assert.deepEqual(validateOrderEmailTemplate(defaultOrderEmailTemplate), defaultOrderEmailTemplate);
  assert.throws(() => validateOrderEmailTemplate({ subject: "Hi", body: "Hello {user_name}" }), /item_name/);
  assert.throws(() => validateOrderEmailTemplate({ subject: "Hi", body: "Hello {user_name} {item_name} {tracking_id}" }), /Unsupported/);
  assert.throws(() => validateOrderEmailTemplate({ subject: "Hi\nBcc: x", body: "Hello {user_name} {item_name}" }), /subject/);
});

test("the private shipping draft keeps delivery details for the manual update", () => {
  assert.match(manualShippingEmail.body, /once you've received it/i);
  assert.doesNotMatch(manualShippingEmail.body, /short review/i);
  assert.match(manualShippingEmail.body, /\{tracking_id\}/);
  assert.ok(!manualShippingEmailText.includes("**"));
  assert.ok(!manualShippingEmailText.includes("[support@"));
});

test("shipping draft fills customer, bold item, courier and tracking without sending", () => {
  const email = composeManualEmail("shipping", order, defaultShippingEmailTemplate, {
    courierName: "India Post", trackingId: "AB123456789IN",
  });
  assert.match(email.subject, /on its way/i);
  assert.match(email.text, /India Post/);
  assert.match(email.text, /AB123456789IN/);
  assert.match(email.html, /<strong>Flower &lt;Card&gt; × 2<\/strong>/);
  assert.ok(!email.html.includes("<Card>"));
});

test("received draft asks for a review and an Instagram tag", () => {
  const email = composeManualEmail("received", order, defaultReceivedEmailTemplate);
  assert.match(email.text, /short review/i);
  assert.match(email.text, /tag Campus Crochet on Instagram/i);
  assert.match(email.html, /<strong>Flower &lt;Card&gt; × 2<\/strong>/);
});

test("each editable template keeps the fields its message needs", () => {
  assert.deepEqual(validateEmailTemplate("shipping", defaultShippingEmailTemplate), defaultShippingEmailTemplate);
  assert.deepEqual(validateEmailTemplate("received", defaultReceivedEmailTemplate), defaultReceivedEmailTemplate);
  assert.throws(() => validateEmailTemplate("shipping", { subject: "Shipped", body: "Hi {user_name}, {item_name}" }), /courier_name/);
  assert.throws(() => validateEmailTemplate("received", { subject: "Received", body: "Hi {user_name}" }), /item_name/);
});

test("only the three known email kinds can be edited", () => {
  assert.equal(parseEmailKind("confirmation"), "confirmation");
  assert.equal(parseEmailKind("shipping"), "shipping");
  assert.equal(parseEmailKind("received"), "received");
  assert.throws(() => parseEmailKind("order_completion"), /email type/i);
});
