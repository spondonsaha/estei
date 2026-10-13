import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withWishlist } from "@/lib/queries";
import { clampSearchParam } from "@/lib/utils";
import { ProductCard } from "@/components/shared/product-card";
import { CategoryFilters } from "@/components/category/category-filters";
import { FilterPanel, SortSelect } from "@/components/category/filter-panel";
import { Pagination } from "@/components/category/pagination";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<
  string,
  { heroTitle: string; heroSubtitle: string; heroImage: string; sizeSet: "mens" | "womens" }
> = {
  mens: {
    heroTitle: "Men's",
    heroSubtitle: "Built for Comfort. Designed for You.",
    heroImage:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=80",
    sizeSet: "mens",
  },
  womens: {
    heroTitle: "Women's",
    heroSubtitle: "Elegance in Every Step.",
    heroImage:
      "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?auto=format&fit=crop&w=1600&q=80",
    sizeSet: "womens",
  },
  casual: {
    heroTitle: "Casual",
    heroSubtitle: "Everyday Comfort. Effortless Style.",
    heroImage:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1600&q=80",
    sizeSet: "mens",
  },
  formal: {
    heroTitle: "Formal",
    heroSubtitle: "Command the Room. Own the Day.",
    heroImage:
      "https://images.unsplash.com/photo-1515324605414-1d5cd106ee70?auto=format&fit=crop&w=1600&q=80",
    sizeSet: "mens",
  },
  sports: {
    heroTitle: "Sports",
    heroSubtitle: "Engineered for Movement. Built to Perform.",
    heroImage:
      "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1600&q=80",
    sizeSet: "mens",
  },
  "new-arrival": {
    heroTitle: "New Arrival",
    heroSubtitle: "Fresh styles. More comfort.",
    heroImage:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=80",
    sizeSet: "mens",
  },
  "best-sellers": {
    heroTitle: "Best Sellers",
    heroSubtitle: "Loved by thousands.",
    heroImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
    sizeSet: "mens",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  return {
    title: meta?.heroTitle ?? "Shop",
    description: meta?.heroSubtitle,
  };
}

const PAGE_SIZE = 12;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const meta = CATEGORY_META[slug];
  if (!meta) notFound();

  const price = clampSearchParam(sp.price)?.split(",").filter(Boolean) ?? [];
  const size = clampSearchParam(sp.size)?.split(",").filter(Boolean) ?? [];
  const colour = clampSearchParam(sp.colour) ?? undefined;
  const sort = clampSearchParam(sp.sort) ?? "featured";
  const page = Math.max(1, Number(clampSearchParam(sp.page) ?? "1"));

  const category = await prisma.category.findUnique({ where: { slug } });
  const baseWhere:
    | { isActive: boolean; isNewArrival?: boolean; isBestSeller?: boolean; categoryId?: string } = {
    isActive: true,
  };
  if (slug === "new-arrival") baseWhere.isNewArrival = true;
  else if (slug === "best-sellers") baseWhere.isBestSeller = true;
  else if (category) baseWhere.categoryId = category.id;

  const where: Record<string, unknown> = {
    ...baseWhere,
    ...(colour ? { variants: { some: { colourName: { equals: colour, mode: "insensitive" as const } } } } : {}),
    ...(size.length > 0 ? { variants: { some: { size: { in: size } } } } : {}),
  };
  if (price.length > 0) {
    const ranges = price.map((id) => {
      switch (id) {
        case "0-2000":
          return { price: { lte: 2000 } };
        case "2001-4000":
          return { price: { gte: 2001, lte: 4000 } };
        case "4001-6000":
          return { price: { gte: 4001, lte: 6000 } };
        case "6001+":
          return { price: { gte: 6001 } };
        default:
          return {};
      }
    });
    where.OR = ranges;
  }

  const orderBy: Record<string, string>[] =
    sort === "price-asc"
      ? [{ price: "asc" }]
      : sort === "price-desc"
        ? [{ price: "desc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }]
          : sort === "rating"
            ? [{ avgRating: "desc" }, { reviewCount: "desc" }]
            : [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }];

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where: where as never }),
    prisma.product.findMany({
      where: where as never,
      orderBy: orderBy as never,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        category: { select: { slug: true, name: true } },
      },
    }),
  ]);

  const cards = await withWishlist(products);
  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <section className="relative h-[180px] bg-estei-black">
        <Image src={meta.heroImage} alt={meta.heroTitle} fill priority sizes="100vw" className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-estei-black/80 to-estei-black/30" />
        <div className="container-estei relative z-10 flex h-full flex-col justify-center">
          <p className="text-sm text-estei-gray-400">
            <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">›</span>{" "}
            <span className="text-white">{meta.heroTitle}</span>
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-white">{meta.heroTitle}</h1>
          <p className="mt-1 text-estei-gray-200">{meta.heroSubtitle}</p>
        </div>
      </section>

      <section className="section-estei">
        <div className="container-estei">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-estei-gray-600">Showing {products.length} products</p>
            <div className="flex flex-wrap items-center gap-3">
              <CategoryFilters sizeSet={meta.sizeSet} />
              <SortSelect current={sort} />
            </div>
          </div>

          <div className="flex gap-8">
            <aside className="hidden w-[280px] shrink-0 rounded-lg border border-estei-gray-200 bg-estei-gray-100 p-5 lg:block">
              <FilterPanel sizeSet={meta.sizeSet} />
            </aside>

            <div className="flex-1">
              {cards.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-lg font-semibold text-estei-gray-900">No products found</p>
                  <p className="mt-2 text-sm text-estei-gray-600">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                  {cards.map((p) => (
                    <ProductCard key={p.id} product={p} compact />
                  ))}
                </div>
              )}

              <Pagination page={page} pageCount={pageCount} />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-[44px] lg:pb-[72px]">
        <div className="container-estei">
          <div className="relative overflow-hidden rounded-lg bg-estei-black">
            <Image
              src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1600&q=80"
              alt="ESTEI lifestyle"
              fill
              sizes="100vw"
              className="object-cover opacity-50"
            />
            <div className="relative px-8 py-16 text-center">
              <h2 className="font-display text-3xl font-bold text-white">
                More Than Just Shoes <br />
                It&apos;s <span className="text-estei-red">a Lifestyle</span>
              </h2>
              <Link href="/category/mens" className="btn-primary mt-6">
                Shop Now →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}