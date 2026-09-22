import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Heart, User, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const [user, orderCount, wishlistCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, isVerified: true, createdAt: true },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.wishlistItem.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="section-estei">
      <div className="container-estei max-w-3xl">
        {!user.isVerified && (
          <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-lg border border-estei-red bg-estei-red-tint p-4 sm:flex-row sm:items-center">
            <p className="text-sm text-estei-gray-900">
              <span className="font-semibold">Email not verified.</span> Verify your email to place orders.
            </p>
            <Link href="/verify-email" className="btn-primary">
              Verify Email
            </Link>
          </div>
        )}

        <div className="rounded-lg border border-estei-gray-200 bg-white p-8 shadow-card">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-estei-red text-xl font-bold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-estei-gray-900">{user.name}</h1>
              <p className="text-sm text-estei-gray-400">{user.email}</p>
              <p className="text-xs text-estei-gray-400">Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>
          {user.phone && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-estei-gray-600">
              <User className="h-4 w-4 text-estei-red" /> {user.phone}
            </p>
          )}
          {session.user.role === "ADMIN" && (
            <Link href="/admin" className="btn-primary mt-6">
              Admin Dashboard →
            </Link>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link href="/account/orders" className="group rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
            <Package className="h-8 w-8 text-estei-red" />
            <h2 className="mt-3 text-lg font-bold text-estei-gray-900">My Orders</h2>
            <p className="mt-1 text-sm text-estei-gray-400">{orderCount} order{orderCount === 1 ? "" : "s"} placed</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-estei-red">
              View orders <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <Link href="/account/wishlist" className="group rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
            <Heart className="h-8 w-8 text-estei-red" />
            <h2 className="mt-3 text-lg font-bold text-estei-gray-900">Wishlist</h2>
            <p className="mt-1 text-sm text-estei-gray-400">{wishlistCount} saved product{wishlistCount === 1 ? "" : "s"}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-estei-red">
              View wishlist <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}