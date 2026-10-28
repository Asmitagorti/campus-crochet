import "server-only";
import { adminDatabase } from "./supabase-admin";
import { Product, products as catalogOrder } from "./catalog";
import { mapStoreProduct, StoreProductRow } from "./store-product";
import { defaultSettings, SiteSettings } from "./site-settings";
import { journal, JournalEntry } from "./journal";

export async function loadProducts(includeUnavailable = false): Promise<Product[]> {
  let query = adminDatabase().from("products")
    .select("product_id,slug,name,category,short_description,full_description,price,stock_quantity,packed_weight_grams,is_available,details,display_colors,revision,product_images(image_url,display_order)")
    .not("slug", "is", null);
  if (!includeUnavailable) query = query.eq("is_available", true);
  const { data, error } = await query.limit(1000);
  if (error) throw error;
  return (data || []).map((row) => mapStoreProduct(row as StoreProductRow))
    .sort((a, b) => {
      const aIndex = catalogOrder.findIndex((item) => item.id === a.id);
      const bIndex = catalogOrder.findIndex((item) => item.id === b.id);
      return (aIndex < 0 ? 10000 : aIndex) - (bIndex < 0 ? 10000 : bIndex) || a.name.localeCompare(b.name);
    });
}

export async function inventory() {
  const rows = await loadProducts();
  return Object.fromEntries(rows.map((row) => [row.id, row.stock || 0]));
}

export async function loadSettings(): Promise<SiteSettings> {
  const { data, error } = await adminDatabase().from("site_content").select("data").eq("key", "settings").maybeSingle();
  if (error) throw error;
  const saved = data?.data && typeof data.data === "object" ? data.data as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(defaultSettings).map(([key, fallback]) => [key, typeof saved[key] === "string" ? saved[key] : fallback])) as SiteSettings;
}

export async function loadJournal(): Promise<JournalEntry[]> {
  const { data, error } = await adminDatabase().from("journey").select("slug,data").eq("published", true).limit(1000);
  if (error) throw error;
  return (data || []).map((row) => ({ ...(row.data as object), slug: row.slug } as JournalEntry))
    .sort((a, b) => {
      const aIndex = journal.findIndex((item) => item.slug === a.slug);
      const bIndex = journal.findIndex((item) => item.slug === b.slug);
      return (aIndex < 0 ? 10000 : aIndex) - (bIndex < 0 ? 10000 : bIndex);
    });
}
