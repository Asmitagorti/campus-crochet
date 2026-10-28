import { orderById } from "@/lib/order-store";
import { requireUser } from "@/lib/supabase-admin";
import { guard, text, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const user = await requireUser(request);
    const b = await readJsonBody(request),
      row = await orderById(text(b.id, 40));
    if (!row || row.userId !== user.uid || row.token !== b.token) throw Error("Order not found.");
    return Response.json(
      {
        id: row.id,
        receipt: row.receipt,
        status: row.status,
        amount: row.amount,
        subtotalPaise: row.subtotalPaise,
        deliveryPaise: row.deliveryPaise,
        deliveryChoice: row.deliveryChoice,
        deliveryAddress: row.deliveryAddress,
        deliveryPin: row.deliveryPin,
        items: row.items,
        testMode: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") || false,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
