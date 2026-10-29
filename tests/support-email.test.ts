import assert from "node:assert/strict";
import { test } from "node:test";
import { composeSupportEmail, sendSupportEmail } from "../lib/support-email";

test("a saved note becomes an escaped email to the studio with a reply address", () => {
  const email = composeSupportEmail({
    id: "8f35e7ad-9f70-44dc-b698-fd712de7b286",
    name: "<script>alert(1)</script>",
    email: "visitor@example.com",
    subject: "Something else",
    message: "Please help with <b>this</b> piece.\nThank you!",
  });
  assert.deepEqual(email.to, ["support@campus-crochet.tech"]);
  assert.equal(email.reply_to, "visitor@example.com");
  assert.match(email.subject, /Something else/);
  assert.match(email.text, /Please help with <b>this<\/b> piece/);
  assert.match(email.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(email.html, /&lt;b&gt;this&lt;\/b&gt;/);
  assert.doesNotMatch(email.html, /<script>|<b>this<\/b>/);
});

test("a note is sent to support through Resend using its saved ID", async () => {
  let request: Request | undefined;
  const fakeFetch = async (input: string | URL | Request, init?: RequestInit) => {
    request = new Request(input, init);
    return Response.json({ id: "resend-message-id" });
  };
  const note = {
    id: "8f35e7ad-9f70-44dc-b698-fd712de7b286",
    name: "Mira",
    email: "visitor@example.com",
    subject: "A product question",
    message: "Can you make this in blue?",
  };
  const providerId = await sendSupportEmail(
    note, "test-key", "Campus Crochet <hello@campus-crochet.tech>", fakeFetch,
  );
  assert.equal(providerId, "resend-message-id");
  assert.equal(request?.url, "https://api.resend.com/emails");
  assert.equal(request?.headers.get("Idempotency-Key"), `support-note/${note.id}`);
  assert.equal(request?.headers.get("Authorization"), "Bearer test-key");
  const body = await request?.json();
  assert.deepEqual(body.to, ["support@campus-crochet.tech"]);
  assert.equal(body.reply_to, "visitor@example.com");
  assert.equal(body.from, "Campus Crochet <hello@campus-crochet.tech>");
});
