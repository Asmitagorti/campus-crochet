import "server-only";
import { adminDatabase } from "./supabase-admin";
import { assertShoppingEnabled, parseSiteMode } from "./poll-domain";

export type SiteMode = "shop" | "poll";

export async function loadSiteMode(): Promise<SiteMode> {
  const { data, error } = await adminDatabase().from("site_runtime")
    .select("mode").eq("id", true).single();
  if (error) throw error;
  return parseSiteMode(data.mode);
}

export async function loadDisplayMode(): Promise<SiteMode> {
  try { return await loadSiteMode(); }
  catch (error) {
    // Keep the existing storefront readable before the additive migration is run.
    if (error && typeof error === "object" && "code" in error &&
      (error.code === "42P01" || error.code === "PGRST205")) return "shop";
    throw error;
  }
}

export async function requireShoppingMode() {
  assertShoppingEnabled(await loadSiteMode());
}
