import { requireAdminAccess } from "@/lib/admin-access";
import { loadDraftProducts } from "@/lib/store-data";
import { parseCheckoutCustomer } from "@/lib/checkout-validation";
import { draftPreviewProduct, previewCheckoutTotal } from "@/lib/shop-drafts";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
import { adminDatabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminAccess(request);
    await guard(request, 30);
    const body = await readJsonBody(request);
    if (!body.cart || typeof body.cart !== "object" || Array.isArray(body.cart))
      throw Error("Add an item to the preview bag.");
    const cart = body.cart as Record<string, unknown>;
    const entries = Object.entries(cart);
    if (!entries.length || entries.length > 50) throw Error("Add an item to the preview bag.");
    const [products, sale] = await Promise.all([
      loadDraftProducts(),
      adminDatabase().from("site_runtime").select("sale_starts_at,sale_ends_at").eq("id", true).single(),
    ]);
    if (sale.error) throw sale.error;
    const saleActive = !sale.data.sale_starts_at ||
      (!!sale.data.sale_ends_at && new Date(sale.data.sale_ends_at).getTime() > Date.now());
    const items = entries.map(([slug, quantity]) => {
      const product = products.find((item) => item.id === slug && item.active);
      if (!product || !Number.isInteger(quantity) || (quantity as number) < 1 ||
        (quantity as number) > 10)
        throw Error("Check the items in your preview bag.");
      return { price: draftPreviewProduct(product, saleActive).price, quantity: quantity as number };
    });
    const customer = parseCheckoutCustomer(body, admin.email);
    const quote = previewCheckoutTotal(items, customer.addressChoice);
    return Response.json({ ...quote, rehearsal: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
