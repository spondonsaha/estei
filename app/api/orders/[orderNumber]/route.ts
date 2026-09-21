import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const session = await auth();

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // only allow the owner (or admin) to view
    if (session?.user?.role !== "ADMIN" && order.userId && order.userId !== session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        district: order.district,
        guestName: order.guestName,
        guestPhone: order.guestPhone,
        guestAddress: order.guestAddress,
        subtotal: order.subtotal.toString(),
        shippingFee: order.shippingFee.toString(),
        discount: order.discount.toString(),
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
    console.error("GET /api/orders/[orderNumber]", err);
    return NextResponse.json({ ok: false, error: "Failed to load order" }, { status: 500 });
  }
}