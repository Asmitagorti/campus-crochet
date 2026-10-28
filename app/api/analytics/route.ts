import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { adminDatabase } from "@/lib/supabase-admin";
import { clampActiveSeconds, isUuid, parseVisitorCookie, signVisitorCookie } from "@/lib/analytics-domain";
import { guard, sameOrigin, errorResponse } from "@/lib/forms";

export const runtime = "nodejs";
const idCookie = "cc_visitor";
const optOutCookie = "cc_analytics_off";
const maxAge = 60 * 60 * 24 * 180;
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
function secret() {
  const value = process.env.ANALYTICS_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw Error("Analytics is not configured.");
  return value;
}

export async function POST(request: Request) {
  try {
    // Campus visitors may share one public IP; visible tabs send about 30 pings in 15 minutes.
    await guard(request, 3000);
    const jar = await cookies();
    if (jar.get(optOutCookie)?.value === "1") return Response.json({ recorded: false });
    const body = await request.json();
    const seconds = clampActiveSeconds(body.activeSeconds);
    if (!isUuid(body.visitId)) throw Error("Invalid visit ID.");
    const existing = parseVisitorCookie(jar.get(idCookie)?.value, secret());
    const visitor = existing || randomUUID();
    const { data: recorded, error } = await adminDatabase().rpc("site_record_activity", {
      p_visitor: visitor, p_visit: body.visitId, p_seconds: seconds,
    });
    if (error) throw error;
    if (recorded && !existing) jar.set(idCookie, signVisitorCookie(visitor, secret()), cookieOptions);
    return Response.json({ recorded: recorded === true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    if (!sameOrigin(request)) throw Error("Please submit this request from the website.");
    const jar = await cookies();
    const visitor = parseVisitorCookie(jar.get(idCookie)?.value, secret());
    if (visitor) {
      const { error } = await adminDatabase().rpc("site_delete_visitor_activity", { p_visitor: visitor });
      if (error) throw error;
    }
    jar.delete(idCookie);
    jar.set(optOutCookie, "1", cookieOptions);
    return Response.json({ optedOut: true });
  } catch (error) { return errorResponse(error); }
}
