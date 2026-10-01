import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminProductSchema } from "@/lib/validations";
import { uniqueProductSlug } from "@/lib/product-slug";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
    const q = request.nextUrl.searchParams.get("q")?.trim();
    const limit = 20;

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where: q ? { name: { contains: q, mode: "insensitive" } } : {} }),
      prisma.product.findMany({
        where: q ? { name: { contains: q, mode: "insensitive" } } : {},
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true } },
          _count: { select: { variants: true, reviews: true } },
          variants: { select: { size: true, stock: true } },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        total,
        page,
        pageCount: Math.ceil(total / limit),
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          categoryId: p.categoryId,
          gender: p.gender,
          price: p.price.toString(),
          compareAtPrice: p.compareAtPrice?.toString() ?? null,
          isActive: p.isActive,
          isNewArrival: p.isNewArrival,
          isBestSeller: p.isBestSeller,
          stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
          sizes: p.variants.map((v) => v.size),
          category: p.category.name,
          reviewCount: p._count.reviews,
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/products", err);
    return NextResponse.json({ ok: false, error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const variants = data.variants ?? [];
    const seen = new Set<string>();
    for (const v of variants) {
      const key = `${v.size}::${v.colourName}`;
      if (seen.has(key)) {
        return NextResponse.json(
          { ok: false, error: `Duplicate variant for size ${v.size} / ${v.colourName}` },
          { status: 400 }
        );
      }
      seen.add(key);
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: await uniqueProductSlug(data.slug, data.name),
        sku: data.sku,
        description: data.description,
        material: data.material,
        price: data.price,
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
        categoryId: data.categoryId,
        gender: data.gender,
        isNewArrival: data.isNewArrival ?? false,
        isBestSeller: data.isBestSeller ?? false,
        isFeatured: data.isFeatured ?? data.isNewArrival ?? false,
        isActive: data.isActive ?? true,
        images: {
          create: (data.images ?? []).map((img, i) => ({
            url: img.url,
            storageKey: img.storageKey ?? null,
            alt: img.alt ?? data.name,
            colour: img.colour,
            sortOrder: img.sortOrder ?? i,
          })),
        },
        variants: {
          create: variants.map((v) => ({
            size: v.size,
            colourName: v.colourName,
            colourHex: v.colourHex,
            stock: v.stock,
            sku: `${data.sku}-${v.size}-${v.colourName.replace(/[^A-Za-z0-9]+/g, "")}`,
          })),
        },
      },
      include: { variants: { select: { id: true, size: true, stock: true } } },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: product.id,
          totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
          variantCount: product.variants.length,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/admin/products", err);
    return NextResponse.json({ ok: false, error: "Failed to create product" }, { status: 500 });
  }
}