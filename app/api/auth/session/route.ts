import { adminAuth, firestore, requireUser } from "@/lib/firebase-admin";
import { errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const token = await requireUser(request),
      f = firestore(),
      config = f.doc("admin_config/singleton"),
      profile = f.doc(`users/${token.uid}`);
    const authorisedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const admin = await f.runTransaction(async (tx) => {
      const [record, user] = await tx.getAll(config, profile);
      let isAdmin = record.data()?.uid === token.uid;
      if (!record.exists && token.email?.toLowerCase() === authorisedEmail) {
        tx.create(config, {
          uid: token.uid,
          email: token.email,
          createdAt: new Date().toISOString(),
        });
        isAdmin = true;
      }
      if (
        record.exists &&
        record.data()?.uid === null &&
        record.data()?.email === token.email?.toLowerCase()
      ) {
        tx.update(config, { uid: token.uid, boundAt: new Date().toISOString() });
        isAdmin = true;
      }
      if (!user.exists)
        tx.create(profile, {
          uid: token.uid,
          email: token.email,
          name: token.name || "",
          role: isAdmin ? "admin" : "customer",
          createdAt: new Date().toISOString(),
        });
      else if (user.data()?.role !== (isAdmin ? "admin" : "customer"))
        tx.update(profile, { role: isAdmin ? "admin" : "customer" });
      return isAdmin;
    });
    const current = await adminAuth().getUser(token.uid),
      role = admin ? "admin" : "customer";
    if (current.customClaims?.role !== role)
      await adminAuth().setCustomUserClaims(token.uid, {
        ...current.customClaims,
        role,
      });
    return Response.json({ admin, role });
  } catch (e) {
    return errorResponse(e, 401);
  }
}
