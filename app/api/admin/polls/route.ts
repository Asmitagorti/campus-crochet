import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
import { parsePollRoundDraft } from "@/lib/poll-admin-validation";

export const runtime = "nodejs";
const isUuid = (value: unknown) => typeof value === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);

export async function POST(request: Request) {
  try {
    await requireAdminAccess(request);
    await guard(request, 40);
    const body = await readJsonBody(request);
    const db = adminDatabase();
    if (body.action === "create") {
      const { data, error } = await db.from("poll_rounds").insert({
        title: "What should I make next?", description: "",
      }).select("id").single();
      if (error) throw error;
      return Response.json({ saved: true, id: data.id });
    }
    if (body.action === "update" && isUuid(body.id)) {
      const fields = parsePollRoundDraft(body);
      const { data, error } = await db.from("poll_rounds").update(fields)
        .eq("id", body.id).eq("status", "draft").select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw Error("Only a draft poll can be edited.");
      return Response.json({ saved: true, id: data.id });
    }
    throw Error("Invalid poll action.");
  } catch (error) { return errorResponse(error); }
}
