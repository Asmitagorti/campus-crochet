import assert from "node:assert/strict";
import test from "node:test";
import { retryTransient } from "../scripts/retry-transient";

test("retries a reset image download and returns the verified result", async () => {
  let calls = 0;
  const result = await retryTransient(async () => {
    calls++;
    if (calls < 3) throw Object.assign(new Error("connection reset"), { code: "ECONNRESET" });
    return "image bytes";
  }, { attempts: 4, delayMs: 0 });
  assert.equal(result, "image bytes");
  assert.equal(calls, 3);
});

test("does not retry a permanent error", async () => {
  let calls = 0;
  await assert.rejects(retryTransient(async () => { calls++; throw Error("bad image"); }, { attempts: 4, delayMs: 0 }), /bad image/);
  assert.equal(calls, 1);
});
