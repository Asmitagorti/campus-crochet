import { validImage } from "@/lib/image-url";
import { requireAdmin, firestore } from "@/lib/firebase-admin";
import { guard, text, errorResponse } from "@/lib/forms";
import { categories } from "@/lib/catalog";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    await guard(request, 60);
    const b = await request.json(),
      id = text(b.id, 70),
      name = text(b.name, 100),
      description = text(b.description, 5000),
      note = text(b.note, 160);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
      name.length < 3 ||
      description.length < 20
    )
      throw Error("Please provide a valid slug, name and description.");
    if (
      !Number.isInteger(b.price) ||
      b.price < 1 ||
      b.price > 100000 ||
      !Number.isInteger(b.stock) ||
      b.stock < 0 ||
      b.stock > 100000
    )
      throw Error("Price and stock must be valid whole numbers.");
    if (!categories.some((c) => c.name === b.category))
      throw Error("Please select a collection.");
    if (
      !Array.isArray(b.gallery) ||
      b.gallery.length < 1 ||
      b.gallery.length > 8 ||
      !b.gallery.every(validImage)
    )
      throw Error("Add between one and eight Cloudinary photos.");
    if (
      !Array.isArray(b.colors) ||
      b.colors.length > 8 ||
      !b.colors.every(
        (c: unknown) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c),
      )
    )
      throw Error("Use valid six-digit colour codes.");
    if (
      !Array.isArray(b.details) ||
      b.details.length > 20 ||
      !b.details.every(
        (d: unknown) =>
          Array.isArray(d) &&
          d.length === 2 &&
          d.every((v) => typeof v === "string" && v.length < 400),
      )
    )
      throw Error("Please check product specifications.");
    const f = firestore(),
      ref = f.doc(`products/${id}`);
    await f.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (b.create && snap.exists)
        throw Error("That product slug already exists.");
      if (!b.create && !snap.exists) throw Error("Product not found.");
      if (snap.exists && b.revision !== snap.data()!.revision)
        throw Error(
          "This product changed in another session. Refresh before saving.",
        );
      tx.set(ref, {
        id,
        name,
        note,
        description,
        category: b.category,
        price: b.price,
        stock: b.stock,
        details: b.details.map(([key, value]: string[]) => ({ key, value })),
        colors: b.colors,
        gallery: b.gallery,
        active: b.active === true,
        madeToOrder: false,
        revision: (snap.data()?.revision || 0) + 1,
        createdAt: snap.data()?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: admin.uid,
      });
      tx.create(f.collection("audit_log").doc(), {
        actor: admin.uid,
        action: b.create ? "product.create" : "product.update",
        target: id,
        at: new Date().toISOString(),
      });
    });
    return Response.json({ saved: true });
  } catch (e) {
    return errorResponse(e);
  }
}
