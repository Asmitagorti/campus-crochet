import assert from "node:assert/strict";
import test from "node:test";
import { parseCheckoutCustomer } from "../lib/checkout-validation";

const base = { name: "Asha Rao", phone: "9876543210", addressChoice: "Aditya Surampalem", consent: true };

test("uses the verified account email and accepts Aditya Surampalem", () => {
  const customer = parseCheckoutCustomer({ ...base, email: "attacker@example.com" }, "asha@gmail.com");
  assert.equal(customer.email, "asha@gmail.com");
  assert.equal(customer.phone, "9876543210");
  assert.equal(customer.addressChoice, "Aditya Surampalem");
  assert.equal(customer.deliveryAddress, "");
});

test("requires exactly ten Indian mobile digits", () => {
  for (const phone of ["987654321", "1987654321", "+919876543210", "98765 43210", "98765432100"]) {
    assert.throws(() => parseCheckoutCustomer({ ...base, phone }, "asha@gmail.com"), /mobile/i);
  }
});

test("requires a complete address and six-digit PIN for Others", () => {
  assert.throws(() => parseCheckoutCustomer({ ...base, addressChoice: "Others" }, "asha@gmail.com"), /address/i);
  assert.throws(() => parseCheckoutCustomer({ ...base, addressChoice: "Elsewhere" }, "asha@gmail.com"), /address/i);
  assert.throws(() => parseCheckoutCustomer({ ...base, addressChoice: "Others", deliveryAddress: "Flat 2, Road 4, Chennai, Tamil Nadu", deliveryPin: "60001" }, "asha@gmail.com"), /PIN/i);
  const customer = parseCheckoutCustomer({ ...base, addressChoice: "Others", deliveryAddress: "Flat 2, Road 4, Chennai, Tamil Nadu", deliveryPin: "600001" }, "asha@gmail.com");
  assert.equal(customer.deliveryPin, "600001");
  assert.equal(customer.deliveryAddress, "Flat 2, Road 4, Chennai, Tamil Nadu");
});
