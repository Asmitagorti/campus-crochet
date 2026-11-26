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

test("accepts Indian mobile numbers with or without the +91 country code", () => {
  assert.equal(parseCheckoutCustomer({ ...base, phone: "+91 98765 43210" }, "asha@gmail.com").phone, "9876543210");
  for (const phone of ["987654321", "1987654321", "+449876543210", "98765432100", "1234567890"]) {
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
  assert.equal(parseCheckoutCustomer({ ...home, city: "New Delhi", state: "DELHI", deliveryPin: "110001" }, "asha@gmail.com").state, "DELHI");
});

test("home delivery PIN must match the entered town or city", () => {
  assert.throws(() => parseCheckoutCustomer({ ...home, city: "Coimbatore" }, "asha@gmail.com"), /town|city/i);
  assert.equal(parseCheckoutCustomer({ ...home, city: "  chennai " }, "asha@gmail.com").city, "chennai");
  assert.equal(parseCheckoutCustomer({ ...home, city: "Flower Bazaar" }, "asha@gmail.com").city, "Flower Bazaar");
  assert.equal(parseCheckoutCustomer({ ...home, city: "Cyberabad", state: "TELANGANA", deliveryPin: "500081" }, "asha@gmail.com").city, "Cyberabad");
  assert.equal(parseCheckoutCustomer({ ...home, city: "Bangalore", state: "KARNATAKA", deliveryPin: "560001" }, "asha@gmail.com").city, "Bangalore");
  assert.equal(parseCheckoutCustomer({ ...home, city: "Delhi", state: "DELHI", deliveryPin: "110025" }, "asha@gmail.com").city, "Delhi");
  assert.throws(() => parseCheckoutCustomer({ ...home, city: "Budaun", state: "DELHI", deliveryPin: "110025" }, "asha@gmail.com"), /town|city/i);
});

test("Kolkata is accepted for the verified Bidhannagar 700064 delivery PIN", () => {
  const address = { ...home, city: "Kolkata", state: "WEST BENGAL", deliveryPin: "700064" };
  assert.equal(parseCheckoutCustomer(address, "asha@gmail.com").deliveryPin, "700064");
  assert.equal(parseCheckoutCustomer({ ...address, city: "Bidhannagar" }, "asha@gmail.com").city, "Bidhannagar");
  assert.throws(() => parseCheckoutCustomer({ ...address, city: "Mumbai" }, "asha@gmail.com"), /town|city/i);
  assert.throws(() => parseCheckoutCustomer({ ...address, state: "MAHARASHTRA" }, "asha@gmail.com"), /state/i);
});
