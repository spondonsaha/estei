import type { Product, ProductImage, ProductVariant, Review } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { CartView, ProductCardData } from "@/lib/types";

type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  category: { slug: string; name: string };
};

export function toProductCard(
  product: ProductWithRelations & { inWishlist?: boolean }
): ProductCardData {
  const mainImage = product.images.find((i) => i.sortOrder === 0) ?? product.images[0];
  const specificColours = Array.from(
    new Map(product.variants.map((v) => [v.colourName, { name: v.colourName, hex: v.colourHex }])).values()
  );
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice?.toString() ?? null,
    avgRating: product.avgRating,
    reviewCount: product.reviewCount,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    image: mainImage?.url ?? "",
    specificColours,
    inWishlist: Boolean(product.inWishlist),
  };
}

export async function getCartLinesForSession(key: { userId: string | null; sessionId: string | null }) {
  if (key.userId) {
    return prisma.cartItem.findMany({
      where: { userId: key.userId },
      orderBy: { createdAt: "asc" },
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
  }
  if (!key.sessionId) return [];
  return prisma.cartItem.findMany({
    where: { sessionId: key.sessionId },
    orderBy: { createdAt: "asc" },
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
}

export async function getCartView(key: { userId: string | null; sessionId: string | null }): Promise<CartView> {
  const items = await getCartLinesForSession(key);
  const lines = items.map((item) => {
    const product = item.product as unknown as ProductWithRelations;
    const variant = product.variants.find((v) => v.id === item.variantId);
    const image = product.images.find((i) => i.sortOrder === 0) ?? product.images[0];
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: product.name,
      slug: product.slug,
      image: image?.url ?? "",
      size: variant?.size ?? "",
      colourName: variant?.colourName ?? "",
      colourHex: variant?.colourHex ?? "",
      unitPrice: product.price.toString(),
      quantity: item.quantity,
      stock: variant?.stock ?? 0,
    };
  });

  const subtotalRaw = lines.reduce((acc, l) => acc + Number(l.unitPrice) * l.quantity, 0);
  const subtotal = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(subtotalRaw);

  return {
    lines,
    subtotal,
    count: lines.reduce((acc, l) => acc + l.quantity, 0),
  };
}

export async function getWishlistProductIds(): Promise<Set<string>> {
  const session = await auth();
  if (!session?.user?.id) return new Set();
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });
  return new Set(items.map((i) => i.productId));
}

export async function withWishlist<T extends ProductWithRelations>(products: T[]): Promise<ProductCardData[]> {
  const wishlist = await getWishlistProductIds();
  return products.map((p) => toProductCard({ ...p, inWishlist: wishlist.has(p.id) }));
}

export type { ProductWithRelations };
export type ReviewWithUser = Review & { user: { name: string; email: string } | null };