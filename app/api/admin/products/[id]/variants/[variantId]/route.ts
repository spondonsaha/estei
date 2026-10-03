import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminVariantStockSchema } from "@/lib/validations";
import { ERR, validationMessage } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_REQUIRED }, { status: 401 });
    }
    const { id, variantId } = await params;

    const body = await request.json();
    const parsed = adminVariantStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: validationMessage(parsed.error.issues, ERR.ADMIN_STOCK_INVALID) },
        { status: 400 }
      );
    }

    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: id },
      select: { id: true, stock: true, size: true, colourName: true },
    });
    if (!variant) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_VARIANT_NOT_FOUND }, { status: 404 });
    }

    const { stock, delta } = parsed.data;

    // A relative step (-1 from the stepper) must never push stock below zero, so the
    // guard goes in the WHERE clause and the write is skipped if it would go negative.
    if (delta !== undefined) {
      const result = await prisma.productVariant.updateMany({
        where: {
          id: variantId,
          ...(delta < 0 ? { stock: { gte: Math.abs(delta) } } : {}),
        },
        data: { stock: { increment: delta } },
      });
      if (result.count === 0) {
        return NextResponse.json({ ok: false, error: ERR.ADMIN_STOCK_NEGATIVE }, { status: 409 });
      }
    } else {
      await prisma.productVariant.update({ where: { id: variantId }, data: { stock: stock! } });
    }

    const updated = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stock: true, size: true, colourName: true },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("PATCH /api/admin/products/[id]/variants/[variantId]", err);
    return NextResponse.json({ ok: false, error: ERR.ADMIN_SAVE_FAILED }, { status: 500 });
  }
}
