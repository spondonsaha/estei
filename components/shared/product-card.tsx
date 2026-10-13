"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/shared/star-rating";
import { WishlistButton } from "@/components/shared/wishlist-button";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-context";
import type { ProductCardData } from "@/lib/types";

export function ProductCard({
  product,
  compact = false,
}: {
  product: ProductCardData;
  compact?: boolean;
}) {
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
            sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </Link>
        <span className={cn("absolute z-10", compact ? "right-1.5 top-1.5" : "right-2 top-2")}>
          <WishlistButton
            productId={product.id}
            initialActive={product.inWishlist}
            size={compact ? 19 : 22}
            className={compact ? "h-8 w-8" : undefined}
          />
        </span>
        {product.isNewArrival && (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-full bg-estei-black/80 font-semibold uppercase tracking-wide text-white",
              compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
            )}
          >
            New
          </span>
        )}
        {product.compareAtPrice && (
          <span
            className={cn(
              "absolute bottom-2 left-2 z-10 rounded-full bg-estei-red font-bold uppercase tracking-wide text-white",
              compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
            )}
          >
            Sale
          </span>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col", compact ? "gap-1 p-2.5" : "gap-1.5 p-4")}>
        <Link
          href={`/product/${product.slug}`}
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-estei-gray-900 transition-colors hover:text-estei-red",
            compact ? "text-[0.83rem]" : "text-[0.95rem]"
          )}
        >
          {product.name}
        </Link>
        <p className={cn("font-semibold text-estei-red", compact ? "text-xs" : "text-sm")}>
          {formatPrice(product.price)}
        </p>
        <div className="flex items-center justify-between">
          <StarRating rating={product.avgRating} size={compact ? 11 : 14} />
          <span className={cn("text-estei-gray-400", compact ? "text-[10px]" : "text-xs")}>
            ({product.reviewCount})
          </span>
        </div>
        <div className={cn("flex items-center justify-end", compact ? "mt-0.5" : "mt-1")}>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd || busy}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-estei-red text-white transition-colors hover:bg-estei-red-hover disabled:cursor-not-allowed disabled:opacity-50",
              compact ? "h-7 px-2 text-[10px]" : "h-9 px-3 text-xs"
            )}
          >
            {busy ? (
              <Loader2 className={cn("animate-spin", compact ? "h-3 w-3" : "h-4 w-4")} />
            ) : (
              <ShoppingBag className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
            )}
            {canAdd ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </article>
  );
}