import assert from "node:assert/strict";
import test from "node:test";
import { adminRoleForEmail, isDesignatedAdminEmail } from "../lib/admin-identity";

test("only the designated verified address is eligible for admin access", () => {
  assert.equal(isDesignatedAdminEmail("asmileis4evr@gmail.com"), true);
  assert.equal(isDesignatedAdminEmail("ASMILEIS4EVR@GMAIL.COM"), true);
  for (const address of [
    "asmileis4evr+shop@gmail.com",
    "asmileis4evr@gmail.com.evil.test",
    "other@gmail.com",
    " asmileis4evr@gmail.com",
    "asmileis4evr@gmail.com ",
    "",
    undefined,
  ]) {
    assert.equal(isDesignatedAdminEmail(address), false, String(address));
  }
});

test("a different signed-in account is assigned the customer role", () => {
  assert.equal(adminRoleForEmail("asmileis4evr@gmail.com"), "admin");
  assert.equal(adminRoleForEmail("other@gmail.com"), "customer");
});
