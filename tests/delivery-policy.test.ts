import assert from "node:assert/strict";
import test from "node:test";
import { deliveryChargePaise, verifyDeliveryQuote } from "../lib/delivery-policy";

test("Aditya delivery is free at every subtotal", () => {
  assert.equal(deliveryChargePaise(29900, false), 0);
  assert.equal(deliveryChargePaise(49900, false), 0);
});

test("home delivery is ₹69 through ₹499 and free above ₹499", () => {
  assert.equal(deliveryChargePaise(29900, true), 6900);
  assert.equal(deliveryChargePaise(49900, true), 6900);
  assert.equal(deliveryChargePaise(49901, true), 0);
  assert.equal(deliveryChargePaise(29900 + 25000, true), 0);
});

test("the server rejects a database quote that does not follow the current policy", () => {
  const quote = { subtotalPaise: 49900, postagePaise: 0, deliveryPaise: 6900, totalPaise: 56800 };
  assert.deepEqual(verifyDeliveryQuote(quote, true), quote);
  assert.throws(() => verifyDeliveryQuote({ ...quote, deliveryPaise: 0, totalPaise: 49900 }, true), /delivery setup/i);
  assert.throws(() => verifyDeliveryQuote({ ...quote, postagePaise: 5400 }, true), /delivery setup/i);
  assert.throws(() => verifyDeliveryQuote({ ...quote, totalPaise: 49900 }, true), /delivery setup/i);
});
