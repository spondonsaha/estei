import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withWishlist } from "@/lib/queries";
import { MEN_SIZE_SET, WOMEN_SIZE_SET } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(60, Math.max(1, Number(searchParams.get("limit") ?? "12")));
    const q = searchParams.get("q")?.trim();
    const size = searchParams.get("size");
    const colour = searchParams.get("colour");
    const sort = searchParams.get("sort");

    const priceIds = searchParams.get("price")?.split(",").filter(Boolean) ?? [];
    const priceOR: Prisma.ProductWhereInput[] = priceIds.map((id) => {
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

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(category === "new-arrival"
        ? { isNewArrival: true }
        : category === "best-sellers"
          ? { isBestSeller: true }
          : category
            ? { category: { slug: category } }
            : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(priceOR.length > 0 ? { OR: priceOR } : {}),
      ...(colour
        ? { variants: { some: { colourName: { equals: colour, mode: "insensitive" } } } }
        : {}),
      ...(size ? { variants: { some: { size } } } : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === "price-asc"
        ? [{ price: "asc" }]
        : sort === "price-desc"
          ? [{ price: "desc" }]
          : sort === "newest"
            ? [{ createdAt: "desc" }]
            : sort === "rating"
              ? [{ avgRating: "desc" }, { reviewCount: "desc" }]
              : [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }];

    const [count, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: { select: { slug: true, name: true } },
        },
      }),
    ]);

    const data = await withWishlist(products);

    return NextResponse.json({
      ok: true,
      data: {
        products: data,
        total: count,
        page,
        pageCount: Math.ceil(count / limit),
        limit,
        sizeSet: category === "womens" ? WOMEN_SIZE_SET : MEN_SIZE_SET,
      },
    });
  } catch (err) {
    console.error("GET /api/products", err);
    return NextResponse.json({ ok: false, error: "Failed to load products" }, { status: 500 });
  }
}