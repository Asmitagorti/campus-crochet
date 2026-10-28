import { createHmac, timingSafeEqual } from "node:crypto";

const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

export function clampActiveSeconds(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return 0;
  return Math.min(30, Math.floor(value));
}

export function signVisitorCookie(id: string, secret: string): string {
  if (!uuid.test(id)) throw Error("Invalid visitor ID.");
  const signature = createHmac("sha256", secret).update(id).digest("hex");
  return `${id}.${signature}`;
}

export function parseVisitorCookie(value: string | undefined, secret: string): string | null {
  if (!value) return null;
  const separator = value.indexOf(".");
  if (separator < 0) return null;
  const id = value.slice(0, separator);
  if (!uuid.test(id)) return null;
  const expected = signVisitorCookie(id, secret).slice(separator + 1);
  const received = value.slice(separator + 1);
  if (received.length !== expected.length || !/^[\da-f]{64}$/i.test(received)) return null;
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex")) ? id : null;
}
