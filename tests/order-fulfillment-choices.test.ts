import assert from "node:assert/strict";
import test from "node:test";
import { adminFulfillmentChoices, adminFulfillmentSelection } from "../lib/order-fulfillment-choices";

test("admin sees the same four delivery stages as the customer", () => {
  assert.deepEqual(adminFulfillmentChoices("Others"), [
    { value: "payment_received", label: "Confirmed" },
    { value: "crocheting", label: "Making" },
    { value: "completed", label: "Ready to send" },
    { value: "dispatched", label: "Dispatched" },
  ]);
  assert.equal(adminFulfillmentChoices("Aditya Surampalem")[3].label, "Collected");
});

test("legacy detailed stages display under the four customer stages", () => {
  assert.equal(adminFulfillmentSelection("quality_check"), "crocheting");
  assert.equal(adminFulfillmentSelection("ready"), "completed");
  assert.equal(adminFulfillmentSelection("dispatched"), "dispatched");
});
