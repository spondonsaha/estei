import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { ERR } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_REQUIRED }, { status: 401 });
    }
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
    const status = request.nextUrl.searchParams.get("status");
    const limit = 20;

    const where = status ? { status: status as never } : {};
    const [total, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        total,
        page,
        pageCount: Math.ceil(total / limit),
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          district: o.district,
          name: o.guestName,
          phone: o.guestPhone,
          email: o.guestEmail,
          addressLine: o.guestAddress,
          city: o.guestCity,
          area: o.guestArea,
          thana: o.guestThana,
          postalCode: o.guestPostalCode,
          notes: o.notes,
          subtotal: o.subtotal.toString(),
          shippingFee: o.shippingFee.toString(),
          total: o.total.toString(),
          createdAt: o.createdAt.toISOString(),
          itemCount: o.items.length,
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/orders", err);
    return NextResponse.json({ ok: false, error: ERR.ADMIN_LOAD_FAILED }, { status: 500 });
  }
}