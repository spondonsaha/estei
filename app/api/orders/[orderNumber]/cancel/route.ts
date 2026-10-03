import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ERR } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

const CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: ERR.UNAUTHORIZED }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ ok: false, error: ERR.ORDER_NOT_FOUND }, { status: 404 });
    }

    const isOwner = session.user.role === "ADMIN" || (order.userId !== null && order.userId === session.user.id);
    if (!isOwner) {
      return NextResponse.json({ ok: false, error: ERR.UNAUTHORIZED }, { status: 401 });
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: { in: CANCELLABLE_STATUSES } },
        data: { status: "CANCELLED" },
      });
      if (updated.count === 0) {
        throw new Error("NOT_CANCELLABLE");
      }

      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: {
            productId_size_colourName: {
              productId: item.productId,
              size: item.size,
              colourName: item.colourName,
            },
          },
        });
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });

    return NextResponse.json({ ok: true, data: { status: "CANCELLED" } });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_CANCELLABLE") {
      return NextResponse.json({ ok: false, error: ERR.ORDER_NOT_CANCELLABLE }, { status: 400 });
    }
    console.error("POST /api/orders/[orderNumber]/cancel", err);
    return NextResponse.json({ ok: false, error: ERR.ORDER_CANCEL_FAILED }, { status: 500 });
  }
}