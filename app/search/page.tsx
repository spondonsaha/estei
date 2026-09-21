import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { withWishlist } from "@/lib/queries";
import { ProductCard } from "@/components/shared/product-card";
import { ProductSearchInput } from "@/components/search/search-input";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return { title: q ? `Search: ${q}` : "Search" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";

  const products = q
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 24,
        orderBy: { createdAt: "desc" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: { select: { slug: true, name: true } },
        },
      })
    : [];

  const cards = await withWishlist(products);

  return (
    <div className="section-estei">
      <div className="container-estei">
        <h1 className="mb-6 text-3xl font-bold text-estei-gray-900">Search</h1>
        <div className="max-w-md">
          <ProductSearchInput initialQuery={q} />
        </div>

        <div className="mt-8">
          {!q ? (
            <p className="py-10 text-center text-sm text-estei-gray-400">Type a keyword above to search our catalog.</p>
          ) : cards.length === 0 ? (
            <p className="py-10 text-center text-sm text-estei-gray-400">
              No results for &ldquo;{q}&rdquo;. Try different keywords.
            </p>
          ) : (
            <>
              <p className="mb-6 text-sm text-estei-gray-600">
                {cards.length} result{cards.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cards.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}