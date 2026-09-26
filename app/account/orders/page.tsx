import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CancelOrderButton } from "@/components/order/cancel-order-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Orders" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="section-estei">
      <div className="container-estei max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-estei-gray-900">My Orders</h1>
          <Link href="/category/mens" className="text-sm font-semibold text-estei-red hover:underline">
            Continue shopping →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg border border-estei-gray-200 bg-white p-14 text-center shadow-card">
            <p className="text-lg font-semibold text-estei-gray-900">No orders yet</p>
            <p className="mt-2 text-sm text-estei-gray-400">When you place an order it will show up here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const cancellable = order.status === "PENDING" || order.status === "CONFIRMED";
              return (
                <div
                  key={order.id}
                  className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/order/${order.orderNumber}`}
                      className="transition-colors hover:text-estei-red"
                    >
                      <p className="font-display font-bold text-estei-gray-900">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-estei-gray-400">
                        {formatDate(order.createdAt)} · {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                        {[order.guestThana, order.district].filter(Boolean).join(", ")}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-estei-red">{formatPrice(Number(order.total))}</span>
                      <Badge variant={order.status === "CANCELLED" ? "outline" : "red"}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                      {cancellable && <CancelOrderButton orderNumber={order.orderNumber} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}