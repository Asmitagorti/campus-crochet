import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { guard, text, errorResponse } from "@/lib/forms";
import { validImage } from "@/lib/image-url";
import { defaultSettings } from "@/lib/site-settings";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const admin = await requireAdminAccess(request);
    await guard(request, 60);
    const body = await readJsonBody(request);
    const db = adminDatabase();
    if (body.type === "order") {
      if (!/^[0-9a-f-]{36}$/i.test(body.id) || !Number.isInteger(body.version)) throw Error("Refresh the order before saving.");
      const { error } = await db.rpc("shop_update_fulfillment", {
        p_id: body.id, p_version: body.version, p_status: body.fulfillment, p_actor: admin.uid,
      });
      if (error) throw error;
      return Response.json({ saved: true });
    }
    if (body.type === "received") {
      if (!/^[0-9a-f-]{36}$/i.test(body.id) || !Number.isInteger(body.version)) throw Error("Refresh the order before saving.");
      const { error } = await db.rpc("shop_mark_received", {
        p_id: body.id, p_version: body.version, p_actor: admin.uid,
      });
      if (error) throw error;
      return Response.json({ saved: true });
    }
    if (body.type === "message") {
      const { error } = await db.from("support_tickets").update({ status: "read" }).eq("id", text(body.id, 40));
      if (error) throw error;
      return Response.json({ saved: true });
    }
    if (!Number.isInteger(body.revision) || body.revision < 0) throw Error("Refresh before saving.");
    if (body.type === "settings") {
      const data: Record<string, string> = {};
      for (const key of Object.keys(defaultSettings))
        data[key] = text(body[key], key === "aboutIntro" || key === "contactIntro" ? 5000 : 1500);
      if (!validImage(data.heroImage) || !validImage(data.storyBackgroundImage) || !validImage(data.storyImage))
        throw Error("Choose images uploaded to Supabase Storage for the site pictures.");
      const { data: result, error } = await db.from("shop_content_drafts")
        .update({ data, revision: body.revision + 1, updated_at: new Date().toISOString() })
        .eq("key", "settings").eq("revision", body.revision).select("revision").maybeSingle();
      if (error) throw error;
      if (!result) throw Error("This draft changed. Refresh before saving.");
      return Response.json({ saved: true, revision: result.revision });
    }
    if (body.type === "journey") {
      const slug = text(body.slug, 80);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || text(body.title, 150).length < 3 || !validImage(body.image))
        throw Error("Please check the chapter title, slug and image.");
      if (!Array.isArray(body.sections) || body.sections.length < 1 || body.sections.length > 20 ||
        !body.sections.every((s: { heading: unknown; paragraphs: unknown }) =>
          typeof s.heading === "string" && s.heading.length < 200 && Array.isArray(s.paragraphs) &&
          s.paragraphs.length <= 20 && s.paragraphs.every((p) => typeof p === "string" && p.length <= 5000)))
        throw Error("Please check the chapter sections.");
      const data = { slug, title: text(body.title, 150), category: text(body.category, 80),
        excerpt: text(body.excerpt, 500), readTime: text(body.readTime, 50), image: body.image,
        sections: body.sections };
      const existing = await db.from("shop_journey_drafts").select("revision").eq("slug", slug).maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data) {
        if (body.revision !== 0) throw Error("This chapter changed. Refresh before saving.");
        const inserted = await db.from("shop_journey_drafts")
          .insert({ slug, data, published: body.published === true, revision: 1 }).select("revision").single();
        if (inserted.error) throw inserted.error;
        return Response.json({ saved: true, revision: inserted.data.revision });
      }
      const updated = await db.from("shop_journey_drafts")
        .update({ data, published: body.published === true, revision: body.revision + 1,
          updated_at: new Date().toISOString() })
        .eq("slug", slug).eq("revision", body.revision).select("revision").maybeSingle();
      if (updated.error) throw updated.error;
      if (!updated.data) throw Error("This chapter changed. Refresh before saving.");
      return Response.json({ saved: true, revision: updated.data.revision });
    }
    throw Error("Unknown content type.");
  } catch (error) { return errorResponse(error); }
}
