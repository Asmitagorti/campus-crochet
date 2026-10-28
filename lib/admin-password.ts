import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const ADMIN_UNLOCK_SECONDS = 60 * 60;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashAdminPassword(password: string) {
  if (typeof password !== "string" || password.length < 16 || password.length > 128 || /[\x00-\x1f\x7f]/.test(password))
    throw Error("Choose an admin password with at least 16 characters (maximum 128).");
  const salt = randomBytes(32);
  const hash = await derive(password, salt);
  return `scrypt-v1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyAdminPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt-v1") return false;
  const salt = Buffer.from(parts[1], "base64url");
  const expected = Buffer.from(parts[2], "base64url");
  if (salt.length !== 32 || expected.length !== 64 || typeof password !== "string") return false;
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected);
}

function signingKey(secret: string, passwordHash: string) {
  return createHmac("sha256", secret).update(passwordHash).digest();
}

export function createAdminUnlockToken(uid: string, sessionId: string, passwordHash: string, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ v: 1, uid, sid: sessionId, exp: now + ADMIN_UNLOCK_SECONDS * 1000 })).toString("base64url");
  const signature = createHmac("sha256", signingKey(secret, passwordHash)).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminUnlockToken(
  token: string | undefined,
  uid: string,
  sessionId: string,
  passwordHash: string,
  secret: string,
  now = Date.now(),
) {
  if (!token || token.length > 1024) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false;
  const expected = createHmac("sha256", signingKey(secret, passwordHash)).update(parts[0]).digest();
  const provided = Buffer.from(parts[1], "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return payload.v === 1 && payload.uid === uid && payload.sid === sessionId &&
      Number.isSafeInteger(payload.exp) && payload.exp > now && payload.exp <= now + ADMIN_UNLOCK_SECONDS * 1000;
  } catch {
    return false;
  }
}
