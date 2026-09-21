import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getestei.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base },
    { url: `${base}/category/sports` },
    { url: `${base}/category/casual` },
    { url: `${base}/category/formal` },
    { url: `${base}/category/heels` },
    { url: `${base}/category/sandals` },
    { url: `${base}/cart` },
    { url: `${base}/checkout` },
    { url: `${base}/dealer` },
    { url: `${base}/search` },
    { url: `${base}/contact` },
    { url: `${base}/faq` },
    { url: `${base}/delivery-information` },
    { url: `${base}/cod-information` },
    { url: `${base}/return-exchange-policy` },
    { url: `${base}/privacy-policy` },
    { url: `${base}/terms-conditions` },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
    ]);
    productRoutes = products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
    }));
    categoryRoutes = categories.map((c) => ({ url: `${base}/category/${c.slug}` }));
  } catch {
    // DB not reachable during build — static routes only.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}