import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/shared/star-rating";
import { WishlistButton } from "@/components/shared/wishlist-button";
import { formatPrice } from "@/lib/utils";
import type { ProductCardData } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-estei-gray-200 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover"
    >
      <div className="relative aspect-square bg-estei-gray-100 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <span className="absolute right-2 top-2 z-10">
          <WishlistButton productId={product.id} initialActive={product.inWishlist} />
        </span>
        {product.isNewArrival && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-estei-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            New
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-[0.95rem] font-semibold leading-snug text-estei-gray-900 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-estei-red">{formatPrice(product.price)}</p>
        <div className="flex items-center justify-between">
          <StarRating rating={product.avgRating} />
          <span className="text-xs text-estei-gray-400">({product.reviewCount})</span>
        </div>
      </div>
    </Link>
  );
}