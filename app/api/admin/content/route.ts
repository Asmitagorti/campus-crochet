import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { dispatchOrderEmails } from "@/lib/order-email-jobs";
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
      if (body.fulfillment === "completed") {
        try { await dispatchOrderEmails(5); } catch (error) { console.error("Completion email queue unavailable", error); }
      }
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
      if (!validImage(data.heroImage)) throw Error("Choose a Supabase hero image.");
      const { data: result, error } = await db.rpc("shop_save_content", {
        p_key: "settings", p_expected: body.revision, p_data: data, p_published: true,
      });
      if (error) throw error;
      return Response.json({ saved: true, revision: result });
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
      const { data: result, error } = await db.rpc("shop_save_content", {
        p_key: `journey/${slug}`, p_expected: body.revision, p_data: data, p_published: body.published === true,
      });
      if (error) throw error;
      return Response.json({ saved: true, revision: result });
    }
    throw Error("Unknown content type.");
  } catch (error) { return errorResponse(error); }
}
