import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
import { parsePollOptionDraft } from "@/lib/poll-admin-validation";

export const runtime = "nodejs";
const isUuid = (value: unknown) => typeof value === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);

export async function POST(request: Request) {
  try {
    await requireAdminAccess(request);
    await guard(request, 60);
    const body = await readJsonBody(request);
    if (!isUuid(body.roundId)) throw Error("Choose a poll first.");
    const db = adminDatabase();
    if ((body.action === "hide" || body.action === "restore") && isUuid(body.id)) {
      const { error } = await db.rpc("poll_set_option_hidden", {
        p_round: body.roundId, p_option: body.id, p_hidden: body.action === "hide",
      });
      if (error) throw error;
      return Response.json({ saved: true });
    }
    if (body.action === "delete" && isUuid(body.id)) {
      const { data, error } = await db.from("poll_options").delete()
        .eq("id", body.id).eq("round_id", body.roundId).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw Error("Design not found.");
      return Response.json({ saved: true });
    }
    if (body.action === "save") {
      const fields = parsePollOptionDraft(body);
      const values = { round_id: body.roundId, title: fields.title, description: fields.description,
        image_url: fields.imageUrl, position: fields.position };
      const query = isUuid(body.id)
        ? db.from("poll_options").update(values).eq("id", body.id).eq("round_id", body.roundId)
        : db.from("poll_options").insert(values);
      const { data, error } = await query.select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw Error("Design could not be saved.");
      return Response.json({ saved: true, id: data.id });
    }
    throw Error("Invalid design action.");
  } catch (error) { return errorResponse(error); }
}
