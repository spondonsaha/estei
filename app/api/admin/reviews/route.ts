import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const rawPage = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = 20;

    const [total, reviews] = await prisma.$transaction([
      prisma.review.count(),
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: { select: { name: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        total,
        page,
        pageCount: Math.ceil(total / limit),
        reviews: reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          comment: r.body,
          isApproved: r.isApproved,
          product: { name: r.product.name, slug: r.product.slug },
          user: r.user ? { name: r.user.name, email: r.user.email } : null,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/reviews", err);
    return NextResponse.json({ ok: false, error: "Failed to load reviews" }, { status: 500 });
  }
}