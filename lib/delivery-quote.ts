import "server-only";
import { adminDatabase } from "./supabase-admin";

export type DeliveryQuote = {
  subtotalPaise: number;
  postagePaise: number;
  deliveryPaise: number;
  totalPaise: number;
  weightGrams: number;
  slabGrams: number | null;
  originPin: string;
};

export async function quoteDelivery(items: { productId: string; quantity: number; color: string }[], pin: string | null): Promise<DeliveryQuote> {
  const { data, error } = await adminDatabase().rpc("shop_quote_delivery", { p_items: items, p_pin: pin });
  if (error) throw error;
  if (!data || typeof data !== "object") throw Error("Delivery quote is unavailable.");
  return data as DeliveryQuote;
}
