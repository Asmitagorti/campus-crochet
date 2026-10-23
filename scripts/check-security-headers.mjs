import assert from "node:assert/strict";

const origin = process.env.TEST_ORIGIN || "http://localhost:3003";
const nonces = new Set();
for (const path of [
  "/",
  "/shop",
  "/account",
  "/checkout",
  "/studio",
  "/api/site",
  "/api/inventory",
]) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200, path);
  const headers = response.headers;
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(
    headers.get("cross-origin-opener-policy"),
    "same-origin-allow-popups",
  );
  assert.equal(headers.get("strict-transport-security"), "max-age=31536000");
  assert.equal(headers.get("x-powered-by"), null);
  if (path.startsWith("/api/")) {
    assert.match(headers.get("cache-control"), /no-store/);
  } else {
    const policy = headers.get("content-security-policy");
    assert.ok(policy);
    assert.ok(!policy.includes("'unsafe-eval'"));
    const scriptPolicy = policy
      .split(";")
      .find((part) => part.trim().startsWith("script-src "));
    assert.ok(!scriptPolicy.includes("'unsafe-inline'"));
    const nonce = scriptPolicy.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(
      nonce && !nonces.has(nonce),
      "A fresh nonce is required for every document",
    );
    nonces.add(nonce);
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\b([^>]*)>/g)];
    assert.ok(scripts.length > 0);
    for (const script of scripts)
      assert.ok(
        script[1].includes(`nonce="${nonce}"`),
        `${path}: script missing document nonce`,
      );
    assert.match(policy, /frame-ancestors 'none'/);
    assert.match(policy, /upgrade-insecure-requests/);
  }
  console.log(`${path}: production security headers passed`);
}
