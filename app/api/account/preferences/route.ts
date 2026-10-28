import { adminDatabase, requireUser } from "@/lib/supabase-admin";
import { loadProducts } from "@/lib/store-data";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const [{ data, error }, products] = await Promise.all([
      adminDatabase().from("carts").select("items,liked").eq("user_id", user.uid).maybeSingle(),
      loadProducts(true),
    ]);
    if (error) throw error;
    const byId = new Map(products.map((p) => [p.databaseId, p.id]));
    const cart: Record<string, number> = {};
    for (const item of Array.isArray(data?.items) ? data.items : []) {
      const slug = byId.get(item.productId);
      if (slug && Number.isInteger(item.quantity) && item.quantity > 0) cart[slug] = item.quantity;
    }
    return Response.json({ cart, liked: Array.isArray(data?.liked) ? data.liked : [] },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, 401); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    await guard(request, 60);
    const body = await readJsonBody(request);
    if (!Array.isArray(body.liked) || body.liked.length > 100 ||
      !body.liked.every((id: unknown) => typeof id === "string" && /^[a-z0-9-]{1,70}$/.test(id)))
      throw Error("Please check your favourites.");
    if (!body.cart || typeof body.cart !== "object" || Array.isArray(body.cart) || Object.keys(body.cart).length > 50)
      throw Error("Please check your bag.");
    const products = await loadProducts(true);
    const bySlug = new Map(products.map((p) => [p.id, p]));
    const items = Object.entries(body.cart).map(([slug, rawQuantity]) => {
      const product = bySlug.get(slug);
      const quantity = Number(rawQuantity);
      if (!product?.databaseId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20)
        throw Error("Please check your bag quantities.");
      return { productId: product.databaseId, quantity, color: "Default" };
    });
    const liked = [...new Set(body.liked as string[])].filter((id) => bySlug.has(id));
    const { error } = await adminDatabase().from("carts").upsert({
      user_id: user.uid, items, liked, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw error;
    return Response.json({ saved: true });
  } catch (error) { return errorResponse(error); }
}
