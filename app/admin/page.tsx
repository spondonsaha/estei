import type { Metadata } from "next";
import Link from "next/link";
import { Package, ShoppingCart, Star, Handshake, Mail, Banknote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin Overview" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export default async function AdminOverviewPage() {
  const [productCount, orderCount, reviewCount, dealerCount, subscriberCount, revenueAgg, pendingDealers, recentOrders] =
    await prisma.$transaction([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.review.count(),
      prisma.dealerApplication.count(),
      prisma.newsletterSubscriber.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ["CANCELLED", "RETURNED"] } } }),
      prisma.dealerApplication.count({ where: { status: "PENDING" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const cards = [
    { href: "/admin/products", icon: Package, label: "Products", value: productCount },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders", value: orderCount },
    { href: "/admin/reviews", icon: Star, label: "Reviews", value: reviewCount },
    { href: "/admin/dealers", icon: Handshake, label: "Dealer Applications", value: dealerCount },
    { href: "/admin/newsletter", icon: Mail, label: "Subscribers", value: subscriberCount },
    { icon: Banknote, label: "Revenue", value: formatPrice(Number(revenueAgg._sum.total ?? 0)) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-estei-gray-900">Admin Overview</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ href, icon: Icon, label, value }) => {
          const content = (
            <>
              <Icon className="h-5 w-5 text-estei-red" />
              <p className="mt-3 font-display text-2xl font-bold text-estei-gray-900">{value}</p>
              <p className="text-xs text-estei-gray-400">{label}</p>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="rounded-lg border border-estei-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
              {content}
            </Link>
          ) : (
            <div key={label} className="rounded-lg border border-estei-gray-200 bg-white p-5 shadow-card">
              {content}
            </div>
          );
        })}
      </div>

      {pendingDealers > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-estei-red/30 bg-estei-red-tint p-4">
          <Handshake className="h-5 w-5 text-estei-red" />
          <p className="flex-1 text-sm text-estei-gray-900">
            {pendingDealers} dealer application{pendingDealers === 1 ? "" : "s"} awaiting review.
          </p>
          <Link href="/admin/dealers" className="btn-primary !py-2 text-sm">Review →</Link>
        </div>
      )}

      <section className="mt-8 rounded-lg border border-estei-gray-200 bg-white shadow-card">
        <div className="border-b border-estei-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-estei-gray-900">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-estei-gray-400">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-estei-gray-100 text-left text-estei-gray-400">
                <th className="px-6 py-3 font-medium">Order #</th>
                <th className="px-6 py-3 font-medium">District</th>
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-estei-gray-100 last:border-0">
                  <td className="px-6 py-3 font-semibold text-estei-gray-900">{o.orderNumber}</td>
                  <td className="px-6 py-3 text-estei-gray-600">{o.district}</td>
                  <td className="px-6 py-3 text-estei-gray-600">{o.paymentMethod}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-estei-red-tint px-2.5 py-0.5 text-xs font-semibold text-estei-red">
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-bold text-estei-red">{formatPrice(Number(o.total))}</td>
                  <td className="px-6 py-3 text-estei-gray-400">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}