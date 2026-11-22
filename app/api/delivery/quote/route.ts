import { requireUser } from "@/lib/supabase-admin";
import { loadProducts } from "@/lib/store-data";
import { resolveCheckoutItems } from "@/lib/checkout-items";
import { quoteDelivery } from "@/lib/delivery-quote";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
import { requireShoppingMode } from "@/lib/site-mode";
import { validateDestination } from "@/lib/indian-postcodes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guard(request, 30);
    await requireShoppingMode();
    await requireUser(request);
    const body = await readJsonBody(request);
    const pin = typeof body.deliveryPin === "string" ? body.deliveryPin.trim() : "";
    const state = typeof body.state === "string" ? body.state.trim() : "";
    validateDestination(pin, state);
    const items = resolveCheckoutItems(body.items, await loadProducts());
    const quote = await quoteDelivery(items, pin);
    return Response.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
