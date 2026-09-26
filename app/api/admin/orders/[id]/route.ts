import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminOrderStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** Statuses from which stock is still held and must be returned to inventory on cancel. */
const STOCK_HELD_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        district: order.district,
        guestName: order.guestName,
        guestPhone: order.guestPhone,
        guestAddress: order.guestAddress,
        userId: order.userId,
        subtotal: order.subtotal.toString(),
        shippingFee: order.shippingFee.toString(),
        total: order.total.toString(),
        notes: order.notes,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          size: i.size,
          colourName: i.colourName,
          unitPrice: i.unitPrice.toString(),
          quantity: i.quantity,
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/orders/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to load order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = adminOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid status" },
        { status: 400 }
      );
    }
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const nextStatus = parsed.data.status;

    // Restock only on a transition INTO CANCELLED, and only from a status that still
    // held stock. The conditional update guards against a concurrent double cancel.
    if (nextStatus === "CANCELLED" && order.status !== "CANCELLED") {
      const restocks = STOCK_HELD_STATUSES.includes(order.status);
      await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id, status: order.status },
          data: { status: "CANCELLED" },
        });
        if (updated.count === 0) {
          throw new Error("STATUS_CHANGED");
        }
        if (!restocks) return;
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
    } else {
      await prisma.order.update({ where: { id }, data: { status: nextStatus } });
    }

    return NextResponse.json({ ok: true, data: { id, status: nextStatus } });
  } catch (err) {
    if (err instanceof Error && err.message === "STATUS_CHANGED") {
      return NextResponse.json(
        { ok: false, error: "Order status changed. Please retry." },
        { status: 409 }
      );
    }
    console.error("PATCH /api/admin/orders/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to update order" }, { status: 500 });
  }
}
