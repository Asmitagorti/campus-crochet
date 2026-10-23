import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio", "/account", "/checkout", "/api/"],
    },
    sitemap: `${process.env.SITE_ORIGIN || "https://campus-crochet.tech"}/sitemap.xml`,
  };
}
