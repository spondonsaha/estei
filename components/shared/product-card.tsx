"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/shared/star-rating";
import { WishlistButton } from "@/components/shared/wishlist-button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-context";
import type { ProductCardData } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);
  const canAdd = Boolean(product.defaultVariantId);

  async function handleAddToCart() {
    if (busy || !canAdd) return;
    setBusy(true);
    try {
      await addItem(product.id, product.defaultVariantId!, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-estei-gray-200 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="relative aspect-square overflow-hidden bg-estei-gray-100">
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 z-0 block"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </Link>
        <span className="absolute right-2 top-2 z-10">
          <WishlistButton productId={product.id} initialActive={product.inWishlist} />
        </span>
        {product.isNewArrival && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-estei-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            New
          </span>
        )}
        {product.compareAtPrice && (
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-estei-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Sale
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-estei-gray-900 transition-colors hover:text-estei-red"
        >
          {product.name}
        </Link>
        <p className="text-sm font-semibold text-estei-red">{formatPrice(product.price)}</p>
        <div className="flex items-center justify-between">
          <StarRating rating={product.avgRating} />
          <span className="text-xs text-estei-gray-400">({product.reviewCount})</span>
        </div>
        <div className="mt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd || busy}
            aria-label={`Add ${product.name} to cart`}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-estei-red px-3 text-xs font-semibold text-white transition-colors hover:bg-estei-red-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
            {canAdd ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </article>
  );
}