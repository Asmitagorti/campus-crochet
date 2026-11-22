import { createHmac, timingSafeEqual } from "node:crypto";
import { isUuid } from "./analytics-domain";

export function signVisitorCookie(id: string, secret: string): string {
  if (!isUuid(id)) throw Error("Invalid visitor ID.");
  const signature = createHmac("sha256", secret).update(id).digest("hex");
  return `${id}.${signature}`;
}

export function parseVisitorCookie(value: string | undefined, secret: string): string | null {
  if (!value) return null;
  const separator = value.indexOf(".");
  if (separator < 0) return null;
  const id = value.slice(0, separator);
  if (!isUuid(id)) return null;
  const expected = signVisitorCookie(id, secret).slice(separator + 1);
  const received = value.slice(separator + 1);
  if (received.length !== expected.length || !/^[\da-f]{64}$/i.test(received)) return null;
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex")) ? id : null;
}
