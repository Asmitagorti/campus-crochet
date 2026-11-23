import assert from "node:assert/strict";
import test from "node:test";
import { dispatchWhatsAppUrl } from "../lib/whatsapp";

test("dispatch draft opens only for a valid Indian mobile and safely encodes the order reference", () => {
  const url = dispatchWhatsAppUrl("9876543210", "CC-123");
  assert.ok(url?.startsWith("https://wa.me/919876543210?text="));
  assert.match(decodeURIComponent(url!), /CC-123/);
  assert.equal(dispatchWhatsAppUrl("123", "CC-123"), null);
  assert.equal(dispatchWhatsAppUrl("9876543210", "CC-123\nFake message"), null);
});
