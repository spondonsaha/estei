import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminOrderStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

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
    const order = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ ok: true, data: { id: order.id, status: order.status } });
  } catch (err) {
    console.error("PATCH /api/admin/orders/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to update order" }, { status: 500 });
  }
}