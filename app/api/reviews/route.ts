import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { ERR, validationMessage } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

const schema = reviewSchema.extend({
  name: z.string().min(2).max(80).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: validationMessage(parsed.error.issues, ERR.REVIEW_INVALID) },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;
    const authorName = session?.user?.name ?? parsed.data.name;

    if (!authorName) {
      return NextResponse.json({ ok: false, error: ERR.REVIEW_NAME_REQUIRED }, { status: 400 });
    }

    if (userId) {
      const existing = await prisma.review.findFirst({
        where: { productId: parsed.data.productId, userId },
      });
      if (existing) {
        return NextResponse.json(
          { ok: false, error: ERR.REVIEW_ALREADY_EXISTS },
          { status: 409 }
        );
      }
    }

    const productExists = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true },
    });
    if (!productExists) {
      return NextResponse.json({ ok: false, error: ERR.PRODUCT_NOT_FOUND }, { status: 404 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId: parsed.data.productId,
          userId,
          authorName,
          rating: parsed.data.rating,
          body: parsed.data.body,
          isApproved: true,
        },
      });

      const agg = await tx.review.aggregate({
        where: { productId: parsed.data.productId, isApproved: true },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.product.update({
        where: { id: parsed.data.productId },
        data: {
          avgRating: Math.round(((agg._avg.rating ?? 0) + Number.EPSILON) * 10) / 10,
          reviewCount: agg._count._all,
        },
      });

      return created;
    });

    return NextResponse.json({ ok: true, data: { id: review.id } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/reviews", err);
    return NextResponse.json({ ok: false, error: ERR.REVIEW_SUBMIT_FAILED }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId");
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
    const limit = 6;
    if (!productId) {
      return NextResponse.json({ ok: false, error: ERR.REVIEW_INVALID }, { status: 400 });
    }

    const [reviews, total] = await prisma.$transaction([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { productId, isApproved: true } }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        reviews: reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
        })),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/reviews", err);
    return NextResponse.json({ ok: false, error: ERR.REVIEW_LOAD_FAILED }, { status: 500 });
  }
}