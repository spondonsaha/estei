import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Phone, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CancelOrderButton } from "@/components/order/cancel-order-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const session = await auth();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) notFound();

  const owner = session?.user?.role === "ADMIN" || (order.userId !== null && order.userId === session?.user?.id) || order.userId === null;
  if (!owner) notFound();

  const name = order.guestName ?? "Your order";

  const canCancel =
    (order.status === "PENDING" || order.status === "CONFIRMED") &&
    (session?.user?.role === "ADMIN" || (order.userId !== null && order.userId === session?.user?.id));

  return (
    <div className="section-estei">
      <div className="container-estei max-w-3xl">
        <div className="rounded-lg border border-estei-gray-200 bg-white p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-16 w-16 text-estei-success" />
          <h1 className="mt-4 text-2xl font-bold text-estei-gray-900">Thank you, {name}!</h1>
          <p className="mt-2 text-sm text-estei-gray-600">Your order has been placed successfully.</p>
          <p className="mt-4 inline-block rounded-md bg-estei-red-tint px-5 py-2 font-display text-lg font-bold text-estei-red">
            {order.orderNumber}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-estei-gray-400">
            <span>{formatDate(order.createdAt)}</span>
            <span>·</span>
            <Badge variant="red">{STATUS_LABEL[order.status] ?? order.status}</Badge>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-estei-gray-200 bg-white shadow-card">
          <div className="border-b border-estei-gray-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-estei-gray-900">
              <Package className="h-5 w-5 text-estei-red" /> Order Items
            </h2>
          </div>
          <ul className="divide-y divide-estei-gray-100 px-6">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <span className="font-semibold text-estei-gray-900">{item.productName}</span>
                  <p className="text-xs text-estei-gray-400">
                    {item.colourName} · Size {item.size} · Qty {item.quantity}
                  </p>
                </div>
                <span className="font-semibold text-estei-gray-900">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-estei-gray-200 px-6 py-4 text-sm">
            <div className="flex justify-between text-estei-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-estei-gray-900">{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-estei-gray-600">
              <span>Delivery</span>
              <span className="font-medium text-estei-gray-900">{formatPrice(Number(order.shippingFee))}</span>
            </div>
            <div className="flex justify-between border-t border-estei-gray-200 pt-3 text-base">
              <span className="font-bold text-estei-gray-900">Total</span>
              <span className="font-bold text-estei-red">{formatPrice(Number(order.total))}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-estei-gray-900">
              <MapPin className="h-4 w-4 text-estei-red" /> Delivery Address
            </h3>
            <p className="text-sm text-estei-gray-600">
              {order.guestName ?? "Registered user"}
              <br />
              {order.guestPhone ?? "—"}
              <br />
              {order.guestAddress ?? order.district}
            </p>
          </div>
          <div className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-estei-gray-900">
              <Phone className="h-4 w-4 text-estei-red" /> Payment
            </h3>
            <p className="text-sm text-estei-gray-600">
              Method: <span className="font-medium text-estei-gray-900">{order.paymentMethod}</span>
              <br />
              Status: <Badge variant="outline" className="mt-1">{order.paymentStatus}</Badge>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/category/mens" className="btn-primary">
            Continue Shopping →
          </Link>
          {canCancel && <CancelOrderButton orderNumber={order.orderNumber} />}
        </div>
      </div>
    </div>
  );
}