import assert from "node:assert/strict";
import test from "node:test";
import { parseCheckoutCustomer } from "../lib/checkout-validation";
import { listStates } from "@devzoy/indian-pincode";
import { indianStates } from "../lib/indian-states";

const base = { name: "Asha Rao", phone: "9876543210", addressChoice: "Aditya Surampalem", consent: true };

test("the state menu matches the postal directory", () => {
  assert.deepEqual([...indianStates], listStates());
});

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

const home = { ...base, addressChoice: "Others", addressLine1: "Flat 2, Lotus Building", areaStreet: "South Street", city: "Chennai", state: "TAMIL NADU", deliveryPin: "600001", landmark: "Near the park" };

test("requires every home address field and assembles a complete saved address", () => {
  for (const field of ["addressLine1", "areaStreet", "city", "state", "deliveryPin"] as const) {
    assert.throws(() => parseCheckoutCustomer({ ...home, [field]: "" }, "asha@gmail.com"));
  }
  assert.throws(() => parseCheckoutCustomer({ ...home, addressChoice: "Elsewhere" }, "asha@gmail.com"), /address/i);
  const customer = parseCheckoutCustomer(home, "asha@gmail.com");
  assert.equal(customer.deliveryPin, "600001");
  assert.equal(customer.deliveryAddress, "Flat 2, Lotus Building, South Street, Chennai, TAMIL NADU, Near the park");
  assert.equal(customer.landmark, "Near the park");
});

test("PIN must exist and match the chosen Indian state", () => {
  assert.throws(() => parseCheckoutCustomer({ ...home, state: "DELHI" }, "asha@gmail.com"), /state/i);
  assert.throws(() => parseCheckoutCustomer({ ...home, deliveryPin: "999999" }, "asha@gmail.com"), /PIN/i);
  assert.throws(() => parseCheckoutCustomer({ ...home, deliveryPin: "60001" }, "asha@gmail.com"), /PIN/i);
  assert.equal(parseCheckoutCustomer({ ...home, state: "DELHI", deliveryPin: "110001" }, "asha@gmail.com").state, "DELHI");
});
