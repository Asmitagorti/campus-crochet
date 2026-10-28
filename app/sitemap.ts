import type { MetadataRoute } from "next";
import { loadProducts, loadJournal } from "@/lib/store-data";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_ORIGIN || "https://campus-crochet.tech",
    [products, journal] = await Promise.all([loadProducts(), loadJournal()]);
  return [
    "",
    "/shop",
    "/about",
    "/contact",
    "/journey",
    "/privacy",
    "/care",
    "/policies",
    ...products.map((p) => `/products/${p.id}`),
    ...journal.map((p) => `/journey/${p.slug}`),
  ].map((path) => ({ url: `${origin}${path}` }));
}
