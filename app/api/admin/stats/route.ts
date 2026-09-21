import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const [productCount, orderCount, pendingOrderCount, reviewCount, pendingReviewCount, dealerCount, pendingDealerCount, subscriberCount, revenueAgg] =
      await prisma.$transaction([
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.review.count(),
        prisma.review.count({ where: { isApproved: false } }),
        prisma.dealerApplication.count(),
        prisma.dealerApplication.count({ where: { status: "PENDING" } }),
        prisma.newsletterSubscriber.count(),
        prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ["CANCELLED", "RETURNED"] } } }),
      ]);

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json({
      ok: true,
      data: {
        productCount,
        orderCount,
        pendingOrderCount,
        reviewCount,
        pendingReviewCount,
        dealerCount,
        pendingDealerCount,
        subscriberCount,
        revenue: (revenueAgg._sum.total ?? 0).toString(),
        recentOrders: recentOrders.map((o) => ({
          orderNumber: o.orderNumber,
          district: o.district,
          total: o.total.toString(),
          status: o.status,
          createdAt: o.createdAt.toISOString(),
          itemCount: o._count.items,
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/stats", err);
    return NextResponse.json({ ok: false, error: "Failed to load stats" }, { status: 500 });
  }
}