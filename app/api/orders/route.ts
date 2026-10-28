import { randomUUID, createHash } from "node:crypto";
import { requireUser } from "@/lib/supabase-admin";
import { loadProducts } from "@/lib/store-data";
import { resolveCheckoutItems } from "@/lib/checkout-items";
import { quoteDelivery } from "@/lib/delivery-quote";
import { createReservedOrder, orderById, orderByKey, claimGateway, attachProvider } from "@/lib/order-store";
import { OrderRow } from "@/lib/order-row";
import { gateway, razorpayKeys } from "@/lib/razorpay";
import { guard, text, errorResponse } from "@/lib/forms";
import { parseCheckoutCustomer } from "@/lib/checkout-validation";
import { readJsonBody } from "@/lib/request-body";
import { requireShoppingMode } from "@/lib/site-mode";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await guard(request);
    await requireShoppingMode();
    const user = await requireUser(request);
    const body = await readJsonBody(request);
    if (body.website) throw Error("Unable to process request.");
    const key = text(request.headers.get("idempotency-key"), 80);
    if (!/^[\da-f-]{36}$/i.test(key)) throw Error("Please refresh checkout and try again.");
    const customer = { ...parseCheckoutCustomer(body, user.email), directBuy: body.directBuy === true };
    const items = resolveCheckoutItems(body.items, await loadProducts());
    const quote = await quoteDelivery(items, customer.addressChoice === "Others" ? customer.deliveryPin : null);
    const amount = quote.totalPaise;
    if (!Number.isSafeInteger(body.expectedAmount) || body.expectedAmount !== amount)
      throw Error("A price or delivery charge has changed. Refresh checkout before paying.");
    const fingerprint = createHash("sha256").update(JSON.stringify({ customer, items })).digest("hex");
    razorpayKeys();
    let row = await orderByKey(key);
    if (row) {
      if (row.userId !== user.uid) throw Error("Checkout does not belong to this account.");
      if (row.fingerprint !== fingerprint) throw Error("Your bag or details changed. Start a new checkout.");
      if (row.status === "paid") return Response.json({ paid: true, id: row.id, token: row.token });
      if (row.status !== "pending") throw Error("This attempt ended. Start a fresh checkout.");
      if (row.provider_id) { await requireShoppingMode(); return Response.json(checkoutData(row)); }
    } else {
      const id = await createReservedOrder({ userId: user.uid, key, fingerprint, customer,
        items: items.map(({ productId, quantity, color }) => ({ productId, quantity, color })), amount });
      row = await orderById(id);
      if (!row) throw Error("Order could not be loaded. Please contact support.");
    }
    const claim = randomUUID();
    await claimGateway(row.id, claim);
    await requireShoppingMode();
    const provider = await gateway<{ id: string; amount: number; currency: string }>("orders", {
      method: "POST",
      body: JSON.stringify({ amount: row.amount, currency: "INR", receipt: row.id, notes: { campus_order: row.receipt } }),
    });
    if (provider.amount !== row.amount || provider.currency !== "INR") throw Error("Payment amount mismatch.");
    await attachProvider(row.id, claim, provider.id);
    await requireShoppingMode();
    row = await orderById(row.id);
    if (!row) throw Error("Order could not be loaded. Please contact support.");
    return Response.json(checkoutData(row), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

function checkoutData(row: OrderRow) {
  const { id } = razorpayKeys();
  return { id: row.id, token: row.token, orderId: row.provider_id, amount: row.amount,
    currency: "INR", key: id, testMode: id.startsWith("rzp_test_") };
}
