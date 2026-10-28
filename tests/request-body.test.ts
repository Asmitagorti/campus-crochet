import assert from "node:assert/strict";
import test from "node:test";
import { readJsonBody, readLimitedBody } from "../lib/request-body";

test("rejects oversized JSON even when Content-Length is absent", async () => {
  const request = new Request("https://campus-crochet.tech/api/contact", {
    method: "POST",
    body: JSON.stringify({ message: "x".repeat(21000) }),
  });
  assert.equal(request.headers.has("content-length"), false);
  await assert.rejects(readJsonBody(request), /too long/i);
});

test("parses small JSON and rejects malformed data", async () => {
  const valid = new Request("https://campus-crochet.tech/api/contact", { method: "POST", body: '{"name":"Ada"}' });
  assert.deepEqual(await readJsonBody(valid), { name: "Ada" });
  const invalid = new Request("https://campus-crochet.tech/api/contact", { method: "POST", body: "{bad" });
  await assert.rejects(readJsonBody(invalid), /invalid request body/i);
});

test("rejects an oversized upload body before parsing the form", async () => {
  const request = new Request("https://campus-crochet.tech/api/admin/upload", {
    method: "POST",
    body: new Uint8Array(4300001),
  });
  await assert.rejects(readLimitedBody(request, 4300000, "Please use a photo smaller than 4 MB."), /smaller than 4 MB/i);
});
