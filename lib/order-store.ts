import "server-only";
import { adminDatabase } from "./supabase-admin";
import { mapOrderRow, OrderRow } from "./order-row";

const selectOrder = "*,order_items(product_id,quantity,price_at_purchase,product_name_at_purchase,selected_color,products(slug,name))";

export async function orderById(id: string): Promise<OrderRow | undefined> {
  const { data, error } = await adminDatabase().from("orders").select(selectOrder).eq("order_id", id).maybeSingle();
  if (error) throw error;
  return data ? mapOrderRow(data) : undefined;
}
export async function orderByKey(key: string): Promise<OrderRow | undefined> {
  const { data, error } = await adminDatabase().from("orders").select(selectOrder).eq("checkout_key", key).maybeSingle();
  if (error) throw error;
  return data ? mapOrderRow(data) : undefined;
}
export async function orderByProvider(providerId: string): Promise<OrderRow | undefined> {
  const { data, error } = await adminDatabase().from("orders").select(selectOrder).eq("razorpay_order_id", providerId).maybeSingle();
  if (error) throw error;
  return data ? mapOrderRow(data) : undefined;
}
export async function createReservedOrder(input: {
  userId: string; key: string; fingerprint: string; customer: Record<string, unknown>;
  items: { productId: string; quantity: number; color: string }[]; amount: number;
}) {
  const { data, error } = await adminDatabase().rpc("shop_create_order", {
    p_user: input.userId, p_items: input.items, p_key: input.key,
    p_customer: input.customer, p_fingerprint: input.fingerprint,
    p_expected_paise: input.amount,
  });
  if (error) throw error;
  return String(data);
}
export async function claimGateway(id: string, claim: string) {
  const { error } = await adminDatabase().rpc("shop_claim_gateway", { p_id: id, p_claim: claim });
  if (error) throw error;
}
export async function attachProvider(id: string, claim: string, providerId: string) {
  const { error } = await adminDatabase().rpc("cc_attach_gateway", { p_id: id, p_claim: claim, p_gateway: providerId });
  if (error) throw error;
}
export async function markPaid(row: OrderRow, paymentId: string) {
  if (!row.provider_id) throw Error("Payment order is missing.");
  const { data, error } = await adminDatabase().rpc("shop_capture_payment", {
    p_gateway: row.provider_id, p_payment: paymentId, p_amount: row.amount, p_currency: "INR",
  });
  if (error) throw error;
  if (data !== row.id) throw Error("Payment was linked to another order.");
}
export async function releaseOrder(id: string) {
  const { error } = await adminDatabase().rpc("shop_release_order", { p_id: id });
  if (error) throw error;
}
export async function allowRequest(key: string, max = 15) {
  const { data, error } = await adminDatabase().rpc("shop_rate_limit", { p_key: key, p_limit: max, p_seconds: 900 });
  if (error) throw error;
  return data === true;
}
