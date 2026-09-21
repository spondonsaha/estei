import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getestei.com";
  return {
    rules: [{ userAgent: "*", disallow: ["/admin", "/account", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}