import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { loadDraftProducts, loadDraftSettings, loadSettings } from "@/lib/store-data";
import { errorResponse } from "@/lib/forms";
import { launchReadiness } from "@/lib/launch-readiness";

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
    const [products, settings, orders, messages, journey, draftState, runtimeState, pollRows, pollSettingsRow] = await Promise.all([
      loadDraftProducts(), loadDraftSettings(),
      allRows("orders", "order_id,receipt_number,total_price,subtotal_paise,postage_paise,delivery_paise,delivery_pin,payment_status,order_status,received_at,ordered_at,version,razorpay_payment_id,customer_snapshot,delivery_choice,delivery_address,order_items(quantity,price_at_purchase,product_name_at_purchase,products(name))", "ordered_at"),
      allRows("support_tickets", "id,name,email,subject,message,status,created_at", "created_at"),
      db.from("shop_journey_drafts").select("slug,data,published,revision").order("updated_at", { ascending: false }),
      db.from("shop_draft_state").select("dirty,revision,last_published_at").eq("id", true).single(),
      db.from("site_runtime").select("mode,active_poll_id,sale_starts_at,sale_ends_at").eq("id", true).single(),
      db.from("poll_rounds").select("id,title,description,status,created_at,opened_at,closed_at,poll_options(*)")
        .order("created_at", { ascending: false }).limit(30),
      db.from("site_content").select("data,revision").eq("key", "poll_settings").maybeSingle(),
    ]);
    if (journey.error) throw journey.error;
    if (draftState.error) throw draftState.error;
    if (runtimeState.error) throw runtimeState.error;
    if (pollRows.error) throw pollRows.error;
    if (pollSettingsRow.error) throw pollSettingsRow.error;
    const polls = await Promise.all((pollRows.data || []).map(async (round) => {
      const { data: result, error } = await db.rpc("poll_results", { p_round: round.id });
      if (error) throw error;
      return { ...round, results: result };
    }));
    return Response.json({
      products,
      siteMode: runtimeState.data.mode,
      shopDraftDirty: draftState.data.dirty,
      shopDraftRevision: draftState.data.revision,
      shopLastPublishedAt: draftState.data.last_published_at,
      saleStartsAt: runtimeState.data.sale_starts_at,
      saleEndsAt: runtimeState.data.sale_ends_at,
      launchReadiness: launchReadiness(process.env),
      activePollId: runtimeState.data.active_poll_id,
      polls,
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
          receivedAt: row.received_at || null,
          version: row.version,
          paymentId: row.razorpay_payment_id || null,
          customer: { name: customer.name || "", email: customer.email || "", phone: customer.phone || "",
            addressChoice: row.delivery_choice || customer.addressChoice,
            deliveryAddress: row.delivery_address || customer.deliveryAddress,
            deliveryPin: row.delivery_pin || customer.deliveryPin,
            addressLine1: customer.addressLine1, areaStreet: customer.areaStreet,
            city: customer.city, state: customer.state, landmark: customer.landmark },
          items: ((row.order_items || []) as { quantity: number; price_at_purchase: number; product_name_at_purchase?: string; products: { name?: string } | null }[])
            .map((item) => ({ name: item.product_name_at_purchase || item.products?.name || "Handmade piece", quantity: Number(item.quantity), price: Number(item.price_at_purchase) })),
          created_at: row.ordered_at,
        };
      }),
      messages: messages.map((m) => ({ id: m.id, name: m.name, email: m.email, topic: m.subject, message: m.message, status: m.status || "new" })),
      journey: (journey.data || []).map((j) => ({ ...(j.data as object), slug: j.slug, published: j.published, revision: j.revision })),
      settings,
      pollSettings: { ...(pollSettingsRow.data?.data && typeof pollSettingsRow.data.data === "object"
        ? pollSettingsRow.data.data : await loadSettings()), revision: pollSettingsRow.data?.revision || 0 },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, 403); }
}
