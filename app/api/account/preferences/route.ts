import { requireUser, firestore } from "@/lib/firebase-admin";
import { guard, errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request),
      doc = await firestore().doc(`preferences/${user.uid}`).get();
    return Response.json(
      { liked: doc.data()?.liked || [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e, 401);
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    await guard(request, 60);
    const b = await request.json();
    if (
      !Array.isArray(b.liked) ||
      b.liked.length > 100 ||
      !b.liked.every(
        (id: unknown) => typeof id === "string" && /^[a-z0-9-]{1,70}$/.test(id),
      )
    )
      throw Error("Please check your favourites.");
    await firestore()
      .doc(`preferences/${user.uid}`)
      .set({
        liked: [...new Set(b.liked)],
        updatedAt: new Date().toISOString(),
      });
    return Response.json({ saved: true });
  } catch (e) {
    return errorResponse(e);
  }
}
