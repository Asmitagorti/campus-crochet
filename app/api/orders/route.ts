import { requireUser } from "@/lib/firebase-admin";
import { randomBytes, createHash } from "node:crypto";
import { maxQuantity } from "@/lib/catalog";
import {
  createReservedOrder,
  orderById,
  orderByKey,
  attachProvider,
  loadProducts,
  OrderRow,
  releaseOrder,
  newReference,
} from "@/lib/database";
import { gateway, razorpayKeys } from "@/lib/razorpay";
import { guard, text, email, errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let reserved: string | undefined;
  let providerCreated = false;
  try {
    await guard(request);
    const user = await requireUser(request);
    const products = await loadProducts();
    const body = await request.json();
    if (body.website)
      return Response.json(
        { error: "Unable to process request." },
        { status: 400 },
      );
    const key = text(request.headers.get("idempotency-key"), 80);
    if (!/^[\da-f-]{36}$/i.test(key))
      throw Error("Please refresh checkout and try again.");
    const name = text(body.name, 80);
    if (name.length < 2) throw Error("Please enter your name.");
    const contact = email(body.email);
    const phone = text(body.phone, 25).replace(/[\s()+-]/g, "");
    if (!/^(?:91)?[6-9]\d{9}$/.test(phone))
      throw Error("Please enter a valid Indian mobile number.");
    if (body.consent !== true)
      throw Error("Please agree to the order and privacy information.");
    const pickup = text(body.pickup, 200);
    if (pickup.length < 3)
      throw Error("Please tell us your campus pickup details.");
    if (
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 20
    )
      throw Error("Your bag is empty or invalid.");
    const seen = new Set<string>();
    const items = body.items
      .map((item: { id: unknown; quantity: unknown }) => {
        const p = products.find((p) => p.id === item.id);
        if (
          !p ||
          seen.has(p.id) ||
          !Number.isInteger(item.quantity) ||
          (item.quantity as number) < 1 ||
          (item.quantity as number) > maxQuantity(p)
        )
          throw Error("Please check the quantities in your bag.");
        seen.add(p.id);
        return {
          id: p.id,
          name: p.name,
          quantity: item.quantity as number,
          price: p.price,
        };
      })
      .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id));
    const customer = {
      name,
      email: contact,
      phone,
      pickup,
      note: text(body.note, 1500),
    };
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ customer, items }))
      .digest("hex");
    let existing = await orderByKey(key);
    if (existing) {
      if (existing.userId !== user.uid)
        throw Error("Checkout does not belong to this account.");
      if (existing.fingerprint !== fingerprint)
        throw Error(
          "Your bag or details changed. Please start a fresh payment.",
        );
      if (existing.status === "paid")
        return Response.json({
          paid: true,
          id: existing.id,
          token: existing.token,
        });
      if (existing.status !== "pending" || !existing.provider_id)
        throw Error(
          "That payment attempt is no longer available. Please try a fresh checkout.",
        );
      return Response.json(checkoutData(existing));
    }
    const id = newReference(),
      token = randomBytes(32).toString("hex"),
      amount =
        items.reduce(
          (sum: number, item: { price: number; quantity: number }) =>
            sum + item.price * item.quantity,
          0,
        ) * 100;
    if (
      !Number.isInteger(body.expectedAmount) ||
      body.expectedAmount !== amount
    )
      throw Error(
        "A price has changed. Please refresh your bag before paying.",
      );
    razorpayKeys();
    await createReservedOrder({
      id,
      token,
      userId: user.uid,
      key,
      fingerprint,
      customer,
      items,
      amount,
    });
    reserved = id;
    const order = await gateway<{
      id: string;
      amount: number;
      currency: string;
    }>("orders", {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: id,
        notes: { campus_order: id },
      }),
    });
    providerCreated = true;
    if (order.amount !== amount || order.currency !== "INR")
      throw Error("Payment amount mismatch.");
    await attachProvider(id, order.id);
    return Response.json(checkoutData((await orderById(id))!), { status: 201 });
  } catch (error) {
    if (reserved && !providerCreated) await releaseOrder(reserved);
    return errorResponse(error);
  }
}
function checkoutData(row: OrderRow) {
  const { id } = razorpayKeys();
  if (row.mode && row.mode !== (id.startsWith("rzp_test_") ? "test" : "live"))
    throw Error(
      "This checkout belongs to a different payment mode. Please start a new checkout.",
    );
  return {
    id: row.id,
    token: row.token,
    orderId: row.provider_id,
    amount: row.amount,
    currency: "INR",
    key: id,
    testMode: id.startsWith("rzp_test_"),
  };
}
