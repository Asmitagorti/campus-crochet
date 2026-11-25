import "server-only";
import { adminDatabase } from "./supabase-admin";
import { Product, products as catalogOrder } from "./catalog";
import { mapStoreProduct, StoreProductRow } from "./store-product";
import { defaultSettings, SiteSettings } from "./site-settings";
import { journal, JournalEntry } from "./journal";
import { draftProductFromRow, ProductDraftRow } from "./shop-drafts";

export async function loadProducts(includeUnavailable = false): Promise<Product[]> {
  const columns = "product_id,slug,name,category,categories,short_description,full_description,price,discount_price,stock_quantity,packed_weight_grams,is_available,details,display_colors,revision,product_images(image_url,display_order)";
  const fetchProducts = (withColorOptions: boolean) => {
    let query = adminDatabase().from("products")
      .select(withColorOptions ? columns.replace("display_colors,revision", "display_colors,color_options,revision") : columns)
      .not("slug", "is", null);
    if (!includeUnavailable) query = query.eq("is_available", true);
    return query.limit(1000);
  };
  let [result, sale] = await Promise.all([
    fetchProducts(true),
    adminDatabase().from("site_runtime").select("sale_ends_at").eq("id", true).single(),
  ]);
  if (result.error && /color_options/i.test(result.error.message)) result = await fetchProducts(false);
  if (result.error) throw result.error;
  if (sale.error) throw sale.error;
  const saleActive = !!sale.data.sale_ends_at && new Date(sale.data.sale_ends_at).getTime() > Date.now();
  return (result.data || []).map((row) => mapStoreProduct(row as unknown as StoreProductRow, saleActive))
    .sort((a, b) => {
      const aIndex = catalogOrder.findIndex((item) => item.id === a.id);
      const bIndex = catalogOrder.findIndex((item) => item.id === b.id);
      return (aIndex < 0 ? 10000 : aIndex) - (bIndex < 0 ? 10000 : bIndex) || a.name.localeCompare(b.name);
    });
}

export async function loadDraftProducts(): Promise<Product[]> {
  const { data, error } = await adminDatabase().from("shop_product_drafts")
    .select("draft_id,slug,data,revision").order("slug").limit(1000);
  if (error) throw error;
  return (data || []).map((row) => draftProductFromRow(row as ProductDraftRow));
}

export async function loadDraftSettings(): Promise<SiteSettings & { revision: number }> {
  const { data, error } = await adminDatabase().from("shop_content_drafts")
    .select("data,revision").eq("key", "settings").single();
  if (error) throw error;
  const saved = data.data && typeof data.data === "object" ? data.data as Record<string, unknown> : {};
  return { ...Object.fromEntries(Object.entries(defaultSettings).map(([key, fallback]) =>
    [key, typeof saved[key] === "string" ? saved[key] : fallback])) as SiteSettings,
    revision: data.revision };
}

export async function loadSettings(key: "settings" | "poll_settings" = "settings"): Promise<SiteSettings> {
  const { data, error } = await adminDatabase().from("site_content").select("data").eq("key", key).maybeSingle();
  if (error) throw error;
  if (!data && key === "poll_settings") return loadSettings("settings");
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
