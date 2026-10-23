import { requireAdmin, firestore } from "@/lib/firebase-admin";
import { loadProducts } from "@/lib/database";
import { errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const f = firestore(),
      [products, orders, messages, journey, settings] = await Promise.all([
        loadProducts(true),
        f.collection("orders").orderBy("created_at", "desc").limit(100).get(),
        f.collection("messages").orderBy("created_at", "desc").limit(100).get(),
        f.collection("journey").get(),
        f.doc("site_content/settings").get(),
      ]);
    return Response.json(
      {
        products,
        orders: orders.docs.map((d) => {
          const { token, idempotency_key, fingerprint, ...data } = d.data();
          return data;
        }),
        messages: messages.docs.map((d) => d.data()),
        journey: journey.docs.map((d) => ({ ...d.data(), slug: d.id })),
        settings: settings.data(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e, 403);
  }
}
