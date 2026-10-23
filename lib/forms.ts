import { createHash } from "node:crypto";
import { allowRequest } from "./database";
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (process.env.SITE_ORIGIN) return origin === process.env.SITE_ORIGIN;
  try {
    const parsed = new URL(origin);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}
export async function guard(request: Request, max = 15) {
  if (!sameOrigin(request))
    throw Error("Please submit this form from the website.");
  const raw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = createHash("sha256").update(raw).digest("hex");
  if (!(await allowRequest(`${new URL(request.url).pathname}:${key}`, max)))
    throw Error("Too many attempts. Please try again in a little while.");
  if (Number(request.headers.get("content-length") || 0) > 20000)
    throw Error("This message is too long.");
}
export function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export function email(value: unknown) {
  const v = text(value, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    throw Error("Please enter a valid email address.");
  return v;
}
export function errorResponse(error: unknown, status = 400) {
  return Response.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
    },
    { status },
  );
}
