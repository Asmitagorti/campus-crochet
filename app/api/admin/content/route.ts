import { requireAdmin, firestore } from "@/lib/firebase-admin";
import { guard, text, errorResponse } from "@/lib/forms";
import { validImage } from "@/lib/image-url";
import { defaultSettings } from "@/lib/site-settings";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    await guard(request, 60);
    const b = await request.json(),
      f = firestore();
    let ref: FirebaseFirestore.DocumentReference, data: Record<string, unknown>;
    if (b.type === "settings") {
      data = {};
      for (const key of Object.keys(defaultSettings))
        data[key] = text(
          b[key],
          key === "aboutIntro" || key === "contactIntro" ? 5000 : 1500,
        );
      if (!/^\d{10}$/.test(String(data.phone)))
        throw Error("Use a 10-digit Indian phone number.");
      if (!validImage(data.heroImage))
        throw Error("Choose a Cloudinary hero image.");
      ref = f.doc("site_content/settings");
    } else if (b.type === "journey") {
      const slug = text(b.slug, 80);
      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
        text(b.title, 150).length < 3 ||
        !validImage(b.image)
      )
        throw Error("Please check the chapter title, slug and image.");
      if (
        !Array.isArray(b.sections) ||
        b.sections.length < 1 ||
        b.sections.length > 20 ||
        !b.sections.every(
          (s: { heading: unknown; paragraphs: unknown }) =>
            typeof s.heading === "string" &&
            s.heading.length < 200 &&
            Array.isArray(s.paragraphs) &&
            s.paragraphs.length <= 20 &&
            s.paragraphs.every(
              (p) => typeof p === "string" && p.length <= 5000,
            ),
        )
      )
        throw Error("Please check your chapter sections.");
      data = {
        slug,
        title: text(b.title, 150),
        category: text(b.category, 80),
        excerpt: text(b.excerpt, 500),
        readTime: text(b.readTime, 50),
        image: b.image,
        published: b.published === true,
        sections: b.sections,
      };
      ref = f.doc(`journey/${slug}`);
    } else if (b.type === "order") {
      if (
        !["preparing", "ready_for_pickup", "collected"].includes(b.fulfillment)
      )
        throw Error("Invalid order stage.");
      const orderRef = f.doc(`orders/${text(b.id, 40)}`);
      await f.runTransaction(async (tx) => {
        const row = await tx.get(orderRef);
        if (row.data()?.status !== "paid")
          throw Error("Only paid orders can be prepared.");
        tx.update(orderRef, {
          fulfillment: b.fulfillment,
          updatedAt: new Date().toISOString(),
        });
        tx.create(f.collection("audit_log").doc(), {
          actor: admin.uid,
          action: "order.fulfillment",
          target: orderRef.id,
          stage: b.fulfillment,
          at: new Date().toISOString(),
        });
      });
      return Response.json({ saved: true });
    } else if (b.type === "message") {
      await f.doc(`messages/${text(b.id, 40)}`).update({ status: "read" });
      return Response.json({ saved: true });
    } else throw Error("Unknown content type.");
    await f.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if ((doc.data()?.revision || 0) !== (b.revision || 0))
        throw Error(
          "This content changed in another session. Refresh before saving.",
        );
      tx.set(ref, {
        ...data,
        revision: (doc.data()?.revision || 0) + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: admin.uid,
      });
      tx.create(f.collection("audit_log").doc(), {
        actor: admin.uid,
        action: `${b.type}.update`,
        target: ref.id,
        at: new Date().toISOString(),
      });
    });
    return Response.json({ saved: true });
  } catch (e) {
    return errorResponse(e);
  }
}
