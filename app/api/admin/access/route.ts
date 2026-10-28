import { adminDatabase, requireAdmin } from "@/lib/supabase-admin";
import { adminPasswordHash, adminUnlockCookie, assertAdminSessionConfigured, isAdminUnlocked } from "@/lib/admin-access";
import { hashAdminPassword, verifyAdminPassword } from "@/lib/admin-password";
import { allowRequest } from "@/lib/order-store";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAdmin(request);
    assertAdminSessionConfigured();
    const hash = await adminPasswordHash();
    return Response.json({ configured: !!hash, unlocked: !!hash && isAdminUnlocked(request, user.uid, user.sessionId, hash) },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, 403); }
}

export async function POST(request: Request) {
  try {
    await guard(request, 10);
    const user = await requireAdmin(request);
    assertAdminSessionConfigured();
    if (!(await allowRequest(`admin-password:${user.uid}`, 5)))
      return Response.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 });
    const body = await readJsonBody(request);
    if (typeof body.password !== "string") throw Error("Enter your admin password.");
    const existingHash = await adminPasswordHash();
    let hash: string;
    if (body.action === "setup") {
      if (existingHash) throw Error("The admin password is already set.");
      hash = await hashAdminPassword(body.password);
      const { data, error } = await adminDatabase().from("admin_portal_credentials")
        .insert({ id: true, password_hash: hash }).select("id").maybeSingle();
      if (error || !data) throw Error("The admin password was already set. Refresh and try again.");
    } else if (body.action === "unlock") {
      if (!existingHash) throw Error("Set an admin password first.");
      if (!(await verifyAdminPassword(body.password, existingHash)))
        return Response.json({ error: "Incorrect admin password." }, { status: 401 });
      hash = existingHash;
    } else {
      throw Error("Invalid admin password action.");
    }
    return Response.json({ configured: true, unlocked: true }, {
      headers: { "Set-Cookie": adminUnlockCookie(user.uid, user.sessionId, hash, request.url), "Cache-Control": "no-store" },
    });
  } catch (error) { return errorResponse(error); }
}
