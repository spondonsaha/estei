import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return NextResponse.json({
      ok: true,
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        heroTitle: c.heroTitle,
        heroSubtitle: c.heroSubtitle,
        heroImage: c.heroImage,
        cardImage: c.cardImage,
        productCount: c._count.products,
      })),
    });
  } catch (err) {
    console.error("GET /api/categories", err);
    return NextResponse.json({ ok: false, error: "We could not load the product categories. Please refresh the page." }, { status: 500 });
  }
}