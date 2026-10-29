import assert from "node:assert/strict";
import test from "node:test";
import { browserDatabase } from "../lib/supabase-client";

test("Google sign-in uses PKCE instead of putting session tokens in the callback URL", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-publishable-key";
  try {
    const { data, error } = await browserDatabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://campus.example/account", skipBrowserRedirect: true },
    });
    assert.equal(error, null);
    const url = new URL(data.url);
    assert.equal(url.searchParams.get("redirect_to"), "https://campus.example/account");
    assert.ok(url.searchParams.get("code_challenge"));
    assert.equal(url.searchParams.get("code_challenge_method"), "s256");
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});
