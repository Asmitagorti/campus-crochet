import type { MetadataRoute } from "next";
import { loadProducts } from "@/lib/database";
import { loadJournal } from "@/lib/content";
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
    ...products.map((p) => `/products/${p.id}`),
    ...journal.map((p) => `/journey/${p.slug}`),
  ].map((path) => ({ url: `${origin}${path}` }));
}
