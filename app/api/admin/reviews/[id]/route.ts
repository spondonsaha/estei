import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminReviewStatusSchema } from "@/lib/validations";
import { ERR } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_REQUIRED }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = adminReviewStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_STATUS_INVALID }, { status: 400 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: { isApproved: parsed.data.isApproved },
      });
      const agg = await tx.review.aggregate({
        where: { productId: updated.productId, isApproved: true },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.product.update({
        where: { id: updated.productId },
        data: {
          avgRating: Math.round(((agg._avg.rating ?? 0) + Number.EPSILON) * 10) / 10,
          reviewCount: agg._count._all,
        },
      });
      return updated;
    });

    return NextResponse.json({ ok: true, data: { id: review.id, isApproved: review.isApproved } });
  } catch (err) {
    console.error("PATCH /api/admin/reviews/[id]", err);
    return NextResponse.json({ ok: false, error: ERR.ADMIN_SAVE_FAILED }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_REQUIRED }, { status: 401 });
    }
    const { id } = await params;

    // Read the productId before deleting so the cached rating summary on the
    // product can be refreshed in the same transaction.
    const existing = await prisma.review.findUnique({
      where: { id },
      select: { id: true, productId: true },
    });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "This review no longer exists. Refresh the page and try again." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      const agg = await tx.review.aggregate({
        where: { productId: existing.productId, isApproved: true },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.product.update({
        where: { id: existing.productId },
        data: {
          avgRating: Math.round(((agg._avg.rating ?? 0) + Number.EPSILON) * 10) / 10,
          reviewCount: agg._count._all,
        },
      });
    });

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    console.error("DELETE /api/admin/reviews/[id]", err);
    return NextResponse.json(
      { ok: false, error: "Could not delete this review. Refresh the page and try again." },
      { status: 500 }
    );
  }
}