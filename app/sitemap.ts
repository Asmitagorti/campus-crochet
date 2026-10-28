import type { MetadataRoute } from "next";
import { loadProducts, loadJournal } from "@/lib/store-data";
import { loadDisplayMode } from "@/lib/site-mode";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_ORIGIN || "https://campus-crochet.tech",
    [products, journal, mode] = await Promise.all([loadProducts(), loadJournal(), loadDisplayMode()]);
  return [
    "",
    mode === "poll" ? "/vote" : "/shop",
    "/about",
    "/contact",
    "/journey",
    "/privacy",
    "/care",
    "/policies",
    ...(mode === "shop" ? products.map((p) => `/products/${p.id}`) : []),
    ...journal.map((p) => `/journey/${p.slug}`),
  ].map((path) => ({ url: `${origin}${path}` }));
}
