import { test } from "node:test";
import assert from "node:assert/strict";
import type { Product } from "../lib/catalog";
import { defaultPersonalization, parseColorOptions, parseOrderPersonalizations } from "../lib/personalization";

const octopus = { id: "octopus", name: "Little Octopus", colorOptions: [
  { name: "Lavender", hex: "#bd9bd2", image: "https://example.com/lavender.jpg" },
  { name: "Pink", hex: "#eeb2c8", image: "https://example.com/pink.jpg" },
] } as Product;
const bunny = { id: "bunny", name: "Bunny", colorOptions: [] } as unknown as Product;

test("gift details stay separate for two pieces of the same design", () => {
  const choices = parseOrderPersonalizations({ octopus: [
    { ...defaultPersonalization(octopus), recipientName: "Ananya", color: "Lavender", message: "Happy birthday!", occasion: "Birthday", hidePrice: true },
    { ...defaultPersonalization(octopus), recipientName: "Mira", color: "Pink", occasion: "Friendship" },
  ] }, [{ product: octopus, quantity: 2 }]);
  assert.equal(choices.octopus[0].recipientName, "Ananya");
  assert.equal(choices.octopus[1].color, "Pink");
  assert.equal(choices.octopus[0].hidePrice, true);
});

test("checkout rejects colours unavailable for that product and extra product choices", () => {
  const gift = { ...defaultPersonalization(bunny), color: "Lavender" };
  assert.throws(() => parseOrderPersonalizations({ bunny: [gift] }, [{ product: bunny, quantity: 1 }]), /colours.*changed/);
  assert.throws(() => parseOrderPersonalizations({ bunny: [defaultPersonalization(bunny)], octopus: [] },
    [{ product: bunny, quantity: 1 }]), /do not match/);
});

test("checkout rejects too many messages, mismatched quantities and unsupported occasions", () => {
  const base = defaultPersonalization(octopus);
  assert.throws(() => parseOrderPersonalizations({ octopus: [{ ...base, message: "x".repeat(281) }] },
    [{ product: octopus, quantity: 1 }]), /gift message/);
  assert.throws(() => parseOrderPersonalizations({ octopus: [base] }, [{ product: octopus, quantity: 2 }]), /Review the choices/);
  assert.throws(() => parseOrderPersonalizations({ octopus: [{ ...base, occasion: "Surprise me" }] },
    [{ product: octopus, quantity: 1 }]), /occasion/);
});

test("a short handwritten note can have line breaks but no control characters", () => {
  const base = defaultPersonalization(octopus);
  const parsed = parseOrderPersonalizations({ octopus: [{ ...base, message: "A little note\nWith love" }] },
    [{ product: octopus, quantity: 1 }]);
  assert.equal(parsed.octopus[0].message, "A little note\nWith love");
  assert.throws(() => parseOrderPersonalizations({ octopus: [{ ...base, message: "bad\u0000note" }] },
    [{ product: octopus, quantity: 1 }]), /gift message/);
});

test("admin colour choices need distinct names and photo fields", () => {
  assert.deepEqual(parseColorOptions([]), []);
  assert.throws(() => parseColorOptions([{ name: "Pink", hex: "#eeb2c8", image: "photo" },
    { name: "pink", hex: "#eeb2c8", image: "photo" }]), /different/);
  assert.throws(() => parseColorOptions([{ name: "Pink", hex: "#eeb2c8", image: "" }]), /photo/);
});
