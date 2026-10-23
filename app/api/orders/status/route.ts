import { orderById } from "@/lib/database";
import { guard, text, errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const b = await request.json(),
      row = await orderById(text(b.id, 40));
    if (!row || row.token !== b.token) throw Error("Order not found.");
    return Response.json(
      {
        id: row.id,
        status: row.status,
        amount: row.amount,
        items: JSON.parse(row.items),
        testMode: row.mode === "test",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
