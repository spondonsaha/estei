import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withWishlist } from "@/lib/queries";
import { ProductCard } from "@/components/shared/product-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Wishlist" };

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/wishlist");

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
          category: { select: { slug: true, name: true } },
        },
      },
    },
  });

  const cards = await withWishlist(wishlistItems.map((i) => i.product));

  return (
    <div className="section-estei">
      <div className="container-estei">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-estei-gray-900">My Wishlist</h1>
          <Link href="/category/mens" className="text-sm font-semibold text-estei-red hover:underline">
            Continue shopping →
          </Link>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-lg border border-estei-gray-200 bg-white p-14 text-center shadow-card">
            <p className="text-lg font-semibold text-estei-gray-900">Your wishlist is empty</p>
            <p className="mt-2 text-sm text-estei-gray-400">Tap the heart on any product to save it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}