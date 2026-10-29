"use client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { hasLegacyAuthTokens } from "./auth-redirect";

let client: SupabaseClient | undefined;
export function browserDatabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw Error("Supabase sign-in is not configured.");
    if (typeof window !== "undefined" && hasLegacyAuthTokens(window.location.hash))
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    client = createClient(url, key, { auth: {
      persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce",
    } });
  }
  return client;
}
