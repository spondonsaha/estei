import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL;
  return {
    rules: [{ userAgent: "*", disallow: ["/admin", "/account", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}