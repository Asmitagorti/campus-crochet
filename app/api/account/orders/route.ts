import { adminDatabase, requireUser } from "@/lib/supabase-admin";
import { errorResponse } from "@/lib/forms";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await adminDatabase().from("orders")
        .select("order_id,receipt_number,total_price,subtotal_paise,delivery_paise,delivery_pin,payment_status,order_status,ordered_at,customer_snapshot,delivery_choice,delivery_address,order_items(quantity,price_at_purchase,product_name_at_purchase,products(name))")
        .eq("user_id", user.uid).order("ordered_at", { ascending: false }).range(offset, offset + 499);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    const orders = rows.map((row) => {
      const customer = row.customer_snapshot && typeof row.customer_snapshot === "object" ? row.customer_snapshot as Record<string, unknown> : {};
      return {
        id: row.receipt_number || row.order_id,
        amount: Math.round(Number(row.total_price || 0) * 100),
        subtotalPaise: Number(row.subtotal_paise ?? Math.round(Number(row.total_price || 0) * 100)),
        deliveryPaise: Number(row.delivery_paise || 0),
        paymentStatus: row.order_status === "cancelled" ? "cancelled" : row.payment_status === "captured" ? "paid" : row.payment_status,
        fulfillment: row.order_status === "pending" ? null : row.order_status,
        status: row.order_status,
        created_at: row.ordered_at,
        customer: { addressChoice: row.delivery_choice || customer.addressChoice || null, deliveryAddress: row.delivery_address || customer.deliveryAddress || null,
          deliveryPin: row.delivery_pin || customer.deliveryPin || null },
        items: ((row.order_items || []) as { products: { name?: string } | null; product_name_at_purchase?: string; quantity: number; price_at_purchase: number }[]).map((item) => ({
          name: item.product_name_at_purchase || (item.products as { name?: string } | null)?.name || "Handmade piece",
          quantity: Number(item.quantity || 0),
          price: Number(item.price_at_purchase || 0),
        })),
      };
    });
    return Response.json({ orders }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, 401);
  }
}
