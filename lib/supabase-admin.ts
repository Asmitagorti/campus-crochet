import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { isGoogleOAuthSession } from "./google-auth";
import { isDesignatedAdminEmail } from "./admin-identity";

let client: SupabaseClient | undefined;
export function adminDatabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw Error("Supabase server credentials are not configured.");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

export async function requireUser(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw Error("Please sign in to continue.");
  const accessToken = header.slice(7);
  const { data, error } = await adminDatabase().auth.getUser(accessToken);
  if (error || !data.user?.email || !data.user.email_confirmed_at)
    throw Error("Please sign in with a verified email address.");
  const { data: tokenData, error: tokenError } = await adminDatabase().auth.getClaims(accessToken);
  if (tokenError || !tokenData?.claims || !isGoogleOAuthSession(data.user.app_metadata, tokenData.claims.amr))
    throw Error("Please sign in with Google to continue.");
  const name = String(data.user.user_metadata?.full_name || data.user.user_metadata?.name || "");
  const { error: profileError } = await adminDatabase().from("users").upsert({
    user_id: data.user.id, email: data.user.email, full_name: name, role: "customer",
  }, { onConflict: "user_id", ignoreDuplicates: true });
  if (profileError) throw profileError;
  return { uid: data.user.id, email: data.user.email, name,
    sessionId: typeof tokenData.claims.session_id === "string" ? tokenData.claims.session_id : "" };
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!isDesignatedAdminEmail(user.email))
    throw Error("Administrator access required.");
  const { data, error } = await adminDatabase().from("users").select("role").eq("user_id", user.uid).maybeSingle();
  if (error || data?.role !== "admin") throw Error("Administrator access required.");
  return user;
}
