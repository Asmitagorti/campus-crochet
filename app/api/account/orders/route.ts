import { firestore, requireUser } from "@/lib/firebase-admin";
import { errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request),
      data = await firestore()
        .collection("orders")
        .where("userId", "==", user.uid)
        .limit(100)
        .get();
    const orders = data.docs
      .map((d) => {
        const p = d.data();
        return {
          id: d.id,
          amount: p.amount,
          status: p.fulfillment || p.status,
          items: p.items,
          created_at: p.created_at,
        };
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return Response.json(
      { orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e, 401);
  }
}
