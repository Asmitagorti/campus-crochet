import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { loadSettings } from "@/lib/store-data";
import { validImage } from "@/lib/image-url";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminAccess(request);
    await guard(request, 30);
    const body = await readJsonBody(request);
    if (!Number.isInteger(body.revision) || body.revision < 0 ||
      !validImage(body.heroImage) || !validImage(body.storyBackgroundImage) || !validImage(body.storyImage))
      throw Error("Choose three pictures uploaded to Supabase Storage, then refresh if this page changed.");
    const db = adminDatabase();
    const current = await db.from("site_content").select("data,revision")
      .eq("key", "poll_settings").maybeSingle();
    if (current.error) throw current.error;
    const settings = current.data?.data && typeof current.data.data === "object"
      ? current.data.data : await loadSettings();
    const data = { ...settings, heroImage: body.heroImage,
      storyBackgroundImage: body.storyBackgroundImage, storyImage: body.storyImage };
    if (!current.data) {
      if (body.revision !== 0) throw Error("Poll pictures changed. Refresh before saving.");
      const inserted = await db.from("site_content").insert({ key: "poll_settings", data, revision: 1 })
        .select("revision").single();
      if (inserted.error) throw inserted.error;
      return Response.json({ saved: true, revision: inserted.data.revision });
    }
    const updated = await db.from("site_content")
      .update({ data, revision: body.revision + 1, updated_at: new Date().toISOString() })
      .eq("key", "poll_settings").eq("revision", body.revision).select("revision").maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data) throw Error("Poll pictures changed. Refresh before saving.");
    return Response.json({ saved: true, revision: updated.data.revision });
  } catch (error) { return errorResponse(error); }
}
