import "server-only";
import { adminDatabase, requireAdmin } from "./supabase-admin";
import { ADMIN_UNLOCK_SECONDS, createAdminUnlockToken, verifyAdminUnlockToken } from "./admin-password";

const COOKIE_NAME = "cc_admin_unlock";

function sessionSecret() {
  const secret = process.env.ADMIN_PORTAL_SESSION_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret))
    throw Error("Admin password protection is not configured.");
  return secret;
}

export async function adminPasswordHash() {
  const { data, error } = await adminDatabase().from("admin_portal_credentials")
    .select("password_hash").eq("id", true).maybeSingle();
  if (error) throw Error("Admin password storage is not configured.");
  return typeof data?.password_hash === "string" ? data.password_hash : null;
}

function unlockCookie(request: Request) {
  const cookies = request.headers.get("cookie")?.split(";") || [];
  return cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
}

export function isAdminUnlocked(request: Request, uid: string, sessionId: string, hash: string) {
  return Boolean(sessionId) && verifyAdminUnlockToken(unlockCookie(request), uid, sessionId, hash, sessionSecret());
}

export function adminUnlockCookie(uid: string, sessionId: string, hash: string, requestUrl: string) {
  if (!sessionId) throw Error("Please sign in with Google again.");
  const token = createAdminUnlockToken(uid, sessionId, hash, sessionSecret());
  const hostname = new URL(requestUrl).hostname;
  const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  return `${COOKIE_NAME}=${token}; Path=/api/admin; Max-Age=${ADMIN_UNLOCK_SECONDS}; HttpOnly; SameSite=Strict${local ? "" : "; Secure"}`;
}

export async function requireAdminAccess(request: Request) {
  const user = await requireAdmin(request);
  const hash = await adminPasswordHash();
  if (!hash || !isAdminUnlocked(request, user.uid, user.sessionId, hash))
    throw Error("Enter your admin password to continue.");
  return user;
}

export function assertAdminSessionConfigured() {
  sessionSecret();
}
