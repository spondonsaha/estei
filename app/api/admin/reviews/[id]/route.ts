import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/admin";
import { adminReviewStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** Recalculates the denormalised rating summary on a product. */
async function refreshProductRating(
  tx: Prisma.TransactionClient,
  productId: string
) {
  const agg = await tx.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.product.update({
    where: { id: productId },
    data: {
      avgRating: Math.round(((agg._avg.rating ?? 0) + Number.EPSILON) * 10) / 10,
      reviewCount: agg._count._all,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApiSession())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = adminReviewStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: { isApproved: parsed.data.isApproved },
      });
      await refreshProductRating(tx, updated.productId);
      return updated;
    });

    return NextResponse.json({ ok: true, data: { id: review.id, isApproved: review.isApproved } });
  } catch (err) {
    console.error("PATCH /api/admin/reviews/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApiSession())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;

    const existing = await prisma.review.findUnique({
      where: { id },
      select: { id: true, productId: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Review not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await refreshProductRating(tx, existing.productId);
    });

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    console.error("DELETE /api/admin/reviews/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to delete review" }, { status: 500 });
  }
}