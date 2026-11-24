import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
import { EMAIL_TEMPLATE_KEYS, loadEmailTemplate } from "@/lib/order-email-template-store";
import { parseEmailKind, validateEmailTemplate } from "@/lib/order-email";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdminAccess(request);
    const kind = parseEmailKind(new URL(request.url).searchParams.get("kind") || "confirmation");
    return Response.json(await loadEmailTemplate(kind), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, 403); }
}

export async function POST(request: Request) {
  try {
    await requireAdminAccess(request);
    await guard(request, 30);
    const body = await readJsonBody(request);
    if (!Number.isInteger(body.revision) || body.revision < 0) throw Error("Refresh the email editor before saving.");
    const kind = parseEmailKind(body.kind || "confirmation");
    const template = validateEmailTemplate(kind, body.template);
    const key = EMAIL_TEMPLATE_KEYS[kind];
    const db = adminDatabase();
    if (body.revision === 0) {
      const current = await db.from("site_content").select("revision")
        .eq("key", key).maybeSingle();
      if (current.error) throw current.error;
      if (current.data) throw Error("The email changed. Refresh before saving.");
      const inserted = await db.from("site_content")
        .insert({ key, data: template, revision: 1 })
        .select("revision").single();
      if (inserted.error) throw Error("The email changed. Refresh before saving.");
      return Response.json({ saved: true, revision: inserted.data.revision });
    }
    const updated = await db.from("site_content")
      .update({ data: template, revision: body.revision + 1, updated_at: new Date().toISOString() })
      .eq("key", key).eq("revision", body.revision)
      .select("revision").maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data) throw Error("The email changed. Refresh before saving.");
    return Response.json({ saved: true, revision: updated.data.revision });
  } catch (error) { return errorResponse(error); }
}
