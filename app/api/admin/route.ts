import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { loadProducts, loadSettings } from "@/lib/store-data";
import { errorResponse } from "@/lib/forms";

export const runtime = "nodejs";

async function allRows(table: "orders" | "support_tickets", select: string, order: string) {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await adminDatabase().from(table).select(select)
      .order(order, { ascending: false }).range(offset, offset + 499);
    if (error) throw error;
    rows.push(...((data || []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < 500) return rows;
  }
}

export async function GET(request: Request) {
  try {
    await requireAdminAccess(request);
    const db = adminDatabase();
    const [products, settings, orders, messages, journey, settingRow, deliveryRates] = await Promise.all([
      loadProducts(true), loadSettings(),
      allRows("orders", "order_id,receipt_number,total_price,subtotal_paise,postage_paise,delivery_paise,delivery_pin,payment_status,order_status,ordered_at,version,customer_snapshot,delivery_choice,delivery_address,order_items(quantity,price_at_purchase,product_name_at_purchase,products(name))", "ordered_at"),
      allRows("support_tickets", "id,name,email,subject,message,status,created_at", "created_at"),
      db.from("journey").select("slug,data,published,revision").order("updated_at", { ascending: false }),
      db.from("site_content").select("revision").eq("key", "settings").maybeSingle(),
      db.from("delivery_rates").select("destination_pin,max_weight_grams,postage_paise,active,verified_at").order("destination_pin").order("max_weight_grams"),
    ]);
    if (journey.error) throw journey.error;
    if (settingRow.error) throw settingRow.error;
    if (deliveryRates.error) throw deliveryRates.error;
    return Response.json({
      products,
      deliveryRates: deliveryRates.data || [],
      orders: orders.map((row) => {
        const customer = row.customer_snapshot && typeof row.customer_snapshot === "object" ? row.customer_snapshot as Record<string, unknown> : {};
        return {
          id: row.order_id,
          receipt: row.receipt_number || row.order_id,
          amount: Math.round(Number(row.total_price || 0) * 100),
          subtotalPaise: Number(row.subtotal_paise ?? Math.round(Number(row.total_price || 0) * 100)),
          deliveryPaise: Number(row.delivery_paise || 0),
          postagePaise: Number(row.postage_paise || 0),
          status: row.payment_status === "captured" ? "paid" : row.order_status === "cancelled" ? "cancelled" : "pending",
          fulfillment: row.order_status,
          version: row.version,
          customer: { name: customer.name || "", email: customer.email || "", phone: customer.phone || "",
            addressChoice: row.delivery_choice || customer.addressChoice,
            deliveryAddress: row.delivery_address || customer.deliveryAddress,
            deliveryPin: row.delivery_pin || customer.deliveryPin },
          items: ((row.order_items || []) as { quantity: number; price_at_purchase: number; product_name_at_purchase?: string; products: { name?: string } | null }[])
            .map((item) => ({ name: item.product_name_at_purchase || item.products?.name || "Handmade piece", quantity: Number(item.quantity), price: Number(item.price_at_purchase) })),
          created_at: row.ordered_at,
        };
      }),
      messages: messages.map((m) => ({ id: m.id, name: m.name, email: m.email, topic: m.subject, message: m.message, status: m.status || "new" })),
      journey: (journey.data || []).map((j) => ({ ...(j.data as object), slug: j.slug, published: j.published, revision: j.revision })),
      settings: { ...settings, revision: settingRow.data?.revision || 0 },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, 403); }
}
