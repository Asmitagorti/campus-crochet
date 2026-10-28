import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
const isUuid = (value: unknown) => typeof value === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);

export async function POST(request: Request) {
  try {
    await requireAdminAccess(request);
    await guard(request, 20);
    const body = await readJsonBody(request);
    if (!["open", "shop", "hold", "pause", "resume", "close"].includes(String(body.action)))
      throw Error("Choose a valid poll action.");
    if (body.action === "open" && !isUuid(body.roundId)) throw Error("Choose a draft poll.");
    const { data, error } = await adminDatabase().rpc("poll_admin_transition", {
      p_action: body.action, p_round: isUuid(body.roundId) ? body.roundId : null,
    });
    if (error) throw error;
    return Response.json({ saved: true, state: data });
  } catch (error) { return errorResponse(error); }
}
