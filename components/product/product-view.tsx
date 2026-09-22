"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Truck,
  Banknote,
  Loader2,
  Send,
  Zap,
} from "lucide-react";
import { StarRating } from "@/components/shared/star-rating";
import { useCart } from "@/components/cart/cart-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MEN_SIZE_CHART, WOMEN_SIZE_CHART } from "@/lib/size-charts";
import { formatPrice, relativeTime, discountPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ProductDetailData, ReviewItem } from "@/lib/product-types";

type VariantData = { id: string; size: string; colourName: string; colourHex: string; stock: number };

export function ProductView({ product }: { product: ProductDetailData }) {
  const router = useRouter();
  const { status } = useSession();
  const { addItem } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColour, setSelectedColour] = useState<string>(product.variants[0]?.colourName ?? "");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wished, setWished] = useState(product.inWishlist);

  const discount = product.compareAtPrice
    ? discountPercent(Number(product.price), Number(product.compareAtPrice))
    : 0;

  const mergedVariants = useMemo(() => {
    const map = new Map<string, VariantData>();
    for (const v of product.variants) {
      map.set(`${v.size}|${v.colourName}`, { id: v.id, size: v.size, colourName: v.colourName, colourHex: v.colourHex, stock: v.stock });
    }
    return map;
  }, [product.variants]);

  const colours = useMemo(() => {
    const seen = new Set<string>();
    return product.variants.filter((v) => {
      if (seen.has(v.colourName)) return false;
      seen.add(v.colourName);
      return true;
    });
  }, [product.variants]);

  const sizesFor = useMemo(() => {
    return Array.from(new Set(product.variants.filter((v) => v.colourName === selectedColour).map((v) => v.size)));
  }, [product.variants, selectedColour]);

  const stockFor = useCallback(
    (size: string) => mergedVariants.get(`${size}|${selectedColour}`)?.stock ?? 0,
    [mergedVariants, selectedColour]
  );
  const variantFor = (size: string) => mergedVariants.get(`${size}|${selectedColour}`);

  const chartName = sizesFor.some((s) => Number(s) >= 41) ? "Men's" : "Women's";
  const chart = chartName === "Men's" ? MEN_SIZE_CHART : WOMEN_SIZE_CHART;

  const [reviews, setReviews] = useState<ReviewItem[]>(product.reviews);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(product.reviewCount);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [ordering, setOrdering] = useState(false);

  function showSizeChart() {
    setActiveTab("size-chart");
    document.getElementById("details-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadMoreReviews() {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?productId=${product.id}&page=${reviewsPage + 1}`);
      const json = (await res.json()) as { ok: boolean; data?: { reviews: ReviewItem[]; total: number; pageCount: number } };
      if (json.ok && json.data) {
        setReviews((prev) => [...prev, ...json.data!.reviews]);
        setReviewsPage((p) => p + 1);
        setReviewsTotal(json.data.total);
      }
    } finally {
      setLoadingReviews(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Please login to write a review");
      router.push("/login");
      return;
    }
    if (reviewBody.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, rating: reviewRating, body: reviewBody.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to submit review");
        return;
      }
      toast.success("Thanks for your review!");
      setReviewBody("");
      router.refresh();
    } finally {
      setSubmittingReview(false);
    }
  }

  async function toggleWishlist() {
    if (status !== "authenticated") {
      toast.info("Please login to use your wishlist");
      router.push("/login");
      return;
    }
    const res = await fetch("/api/wishlist/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string; data?: { added: boolean } };
    if (!res.ok) return;
    setWished(json.data?.added ?? !wished);
    toast.success(json.data?.added ? "Added to wishlist" : "Removed from wishlist");
  }

  function resolveVariant(): VariantData | null {
    if (!selectedSize) {
      toast.error("Please select a size");
      return null;
    }
    const variant = variantFor(selectedSize);
    if (!variant || variant.stock <= 0) {
      toast.error("This size is out of stock");
      return null;
    }
    return variant;
  }

  async function handleAddToCart() {
    const variant = resolveVariant();
    if (!variant) return;
    setAdding(true);
    try {
      await addItem(product.id, variant.id, qty);
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  }

  async function handleOrderNow() {
    const variant = resolveVariant();
    if (!variant) return;
    setOrdering(true);
    try {
      await addItem(product.id, variant.id, qty);
      router.push("/checkout");
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setOrdering(false);
    }
  }

  const distribution = product.ratingDistribution ?? [0, 0, 0, 0, 0]; // [5,4,3,2,1]
  const maxShare = Math.max(1, Math.max(...distribution));

  return (
    <div>
      <div className="container-estei grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <div className="no-scrollbar flex gap-3 overflow-x-auto overflow-y-hidden pb-1 sm:max-h-[600px] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pb-0 sm:pr-1">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-estei-gray-100",
                  i === activeImage ? "border-estei-red" : "border-transparent"
                )}
              >
                <Image src={img.url} alt={img.alt ?? product.name} fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
          <div className="relative flex-1 overflow-hidden rounded-lg bg-estei-gray-100">
            <div className="relative aspect-square">
              <Image
                key={activeImage}
                src={product.images[activeImage]?.url ?? product.images[0]?.url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {discount > 0 && (
              <span className="absolute left-3 top-3 rounded-md bg-estei-red px-2.5 py-1 text-sm font-bold text-white">
                -{discount}%
              </span>
            )}
          </div>
        </div>

        {/* Buy box */}
        <div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-estei-gray-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={product.avgRating} showValue />
            <span className="text-sm text-estei-gray-400">({product.reviewCount} reviews)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            {product.compareAtPrice && (
              <span className="text-lg text-estei-gray-400 line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
            <span className="font-display text-3xl font-bold text-estei-red">{formatPrice(product.price)}</span>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-estei-gray-900">Available Colours</p>
            <div className="flex flex-wrap gap-2">
              {colours.map((c) => (
                <button
                  key={c.colourName}
                  onClick={() => {
                    setSelectedColour(c.colourName);
                    setSelectedSize("");
                  }}
                  aria-label={`Select colour ${c.colourName}`}
                  className={cn(
                    "h-8 w-8 rounded-full border-2",
                    selectedColour === c.colourName ? "ring-2 ring-estei-red ring-offset-2 border-white" : "border-estei-gray-200"
                  )}
                  style={{ backgroundColor: c.colourHex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-estei-gray-900">Size</p>
              <button className="text-sm font-medium text-estei-red hover:underline" type="button" onClick={showSizeChart}>
                Size Chart
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizesFor.map((size) => {
                const stock = stockFor(size);
                const out = stock <= 0;
                return (
                  <button
                    key={size}
                    disabled={out}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "h-11 min-w-11 rounded-md border px-3 text-sm font-semibold transition-colors",
                      out
                        ? "cursor-not-allowed border-estei-gray-200 text-estei-gray-400 line-through"
                        : selectedSize === size
                          ? "border-estei-black bg-estei-black text-white"
                          : "border-estei-gray-200 text-estei-gray-900 hover:border-estei-red"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex shrink-0 items-center gap-2 rounded-md border border-estei-gray-200 px-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2" aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="p-2" aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={toggleWishlist}
              aria-label="Toggle wishlist"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-estei-gray-200 hover:bg-estei-gray-100"
            >
              <Heart className={cn("h-5 w-5", wished ? "fill-estei-red text-estei-red" : "text-estei-gray-400")} />
            </button>
            <Button className="h-11 shrink-0 px-5 sm:px-6" onClick={handleAddToCart} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
              Add to Cart
            </Button>
            <Button variant="black" className="h-11 shrink-0 px-5 sm:px-6" onClick={handleOrderNow} disabled={ordering}>
              {ordering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Order Now
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 rounded-lg border border-estei-gray-200 bg-white p-4 text-center text-sm">
            <div>
              <Truck className="mx-auto mb-1 h-6 w-6 text-estei-red" />
              <p className="font-semibold text-estei-gray-900">Fast Delivery</p>
              <p className="text-xs text-estei-gray-400">2–3 working days</p>
            </div>
            <div>
              <Banknote className="mx-auto mb-1 h-6 w-6 text-estei-red" />
              <p className="font-semibold text-estei-gray-900">Cash on Delivery</p>
              <p className="text-xs text-estei-gray-400">Available</p>
            </div>
            <div>
              <RotateCcw className="mx-auto mb-1 h-6 w-6 text-estei-red" />
              <p className="font-semibold text-estei-gray-900">7 Days Return</p>
              <p className="text-xs text-estei-gray-400">Easy & Hassle Free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container-estei mt-14" id="details-section">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="size-chart">Size Chart</TabsTrigger>
            <TabsTrigger value="material">Material</TabsTrigger>
            <TabsTrigger value="colour">Colour</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Info</TabsTrigger>
            <TabsTrigger value="cod">COD Info</TabsTrigger>
            <TabsTrigger value="returns">Return Policy</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                <p className="mb-1 text-sm text-estei-gray-400">Material</p>
                <p className="font-semibold text-estei-gray-900">{product.material}</p>
                <p className="mb-1 mt-5 text-sm text-estei-gray-400">Available Colours</p>
                <div className="flex gap-2">
                  {colours.map((c) => (
                    <span key={c.colourName} className="h-6 w-6 rounded-full border border-estei-gray-200" style={{ backgroundColor: c.colourHex }} title={c.colourName} />
                  ))}
                </div>
                <p className="mb-1 mt-5 text-sm text-estei-gray-400">Description</p>
                <p className="leading-relaxed text-estei-gray-600">{product.description}</p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-estei-gray-200">
                <h3 className="border-b border-estei-gray-200 bg-estei-gray-100 px-4 py-3 font-semibold text-estei-gray-900">
                  Size Chart ({chartName})
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-estei-gray-200 text-left text-estei-gray-400">
                      <th className="px-4 py-2 font-medium">EU Size</th>
                      <th className="px-4 py-2 font-medium">UK Size</th>
                      <th className="px-4 py-2 font-medium">Foot Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.map((row) => (
                      <tr key={row.eu} className="border-b border-estei-gray-100 last:border-0">
                        <td className="px-4 py-2 font-semibold text-estei-gray-900">{row.eu}</td>
                        <td className="px-4 py-2 text-estei-gray-600">{row.uk}</td>
                        <td className="px-4 py-2 text-estei-gray-600">{row.cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="size-chart">
            <div className="max-w-lg overflow-x-auto rounded-lg border border-estei-gray-200">
              <h3 className="border-b border-estei-gray-200 bg-estei-gray-100 px-4 py-3 font-semibold text-estei-gray-900">
                Size Chart ({chartName})
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-estei-gray-200 text-left text-estei-gray-400">
                    <th className="px-4 py-2 font-medium">EU Size</th>
                    <th className="px-4 py-2 font-medium">UK Size</th>
                    <th className="px-4 py-2 font-medium">Foot Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.map((row) => (
                    <tr key={row.eu} className="border-b border-estei-gray-100 last:border-0">
                      <td className="px-4 py-2 font-semibold text-estei-gray-900">{row.eu}</td>
                      <td className="px-4 py-2 text-estei-gray-600">{row.uk}</td>
                      <td className="px-4 py-2 text-estei-gray-600">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="material">
            <div className="max-w-2xl">
              <p className="font-semibold text-estei-gray-900">{product.material}</p>
              <p className="mt-3 leading-relaxed text-estei-gray-600">
                Our shoes are crafted with premium breathable mesh fabric and a cushioned EVA sole for all-day comfort.
                Designed to be lightweight yet durable for daily wear, walking and sports.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="colour">
            <div className="flex flex-wrap gap-3">
              {colours.map((c) => (
                <div key={c.colourName} className="flex items-center gap-2 rounded-md border border-estei-gray-200 px-3 py-2">
                  <span className="h-5 w-5 rounded-full border border-estei-gray-200" style={{ backgroundColor: c.colourHex }} />
                  <span className="text-sm text-estei-gray-600">{c.colourName}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="delivery">
            <div className="max-w-2xl space-y-2 text-sm leading-relaxed text-estei-gray-600">
              <p><span className="font-semibold text-estei-gray-900">Fast Delivery:</span> orders are delivered within 2–3 working days anywhere in Bangladesh.</p>
              <p><span className="font-semibold text-estei-gray-900">Inside Dhaka:</span> delivery within 1–2 working days, shipping fee ৳80.</p>
              <p><span className="font-semibold text-estei-gray-900">Outside Dhaka:</span> delivery within 2–3 working days, shipping fee ৳120.</p>
            </div>
          </TabsContent>

          <TabsContent value="cod">
            <div className="max-w-2xl space-y-2 text-sm leading-relaxed text-estei-gray-600">
              <p>Cash on Delivery (COD) is available across all districts of Bangladesh.</p>
              <p>You can pay in cash when your order arrives. Please have the exact amount ready if possible.</p>
              <p>No advance payment is required for COD orders.</p>
            </div>
          </TabsContent>

          <TabsContent value="returns">
            <div className="max-w-2xl space-y-2 text-sm leading-relaxed text-estei-gray-600">
              <p>You have <span className="font-semibold text-estei-gray-900">7 days</span> from delivery to request a return or exchange.</p>
              <p>Items must be unused, unworn and in their original packaging. Please contact our support team to initiate a return.</p>
              <p>Refunds for prepaid orders are processed within 5–7 working days.</p>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-lg border border-estei-gray-200 p-6 text-center">
                <p className="font-display text-5xl font-bold text-estei-gray-900">{product.avgRating.toFixed(1)}</p>
                <p className="mt-1 text-sm text-estei-gray-400">out of 5</p>
                <div className="mt-2 flex justify-center">
                  <StarRating rating={product.avgRating} size={16} />
                </div>
                <p className="mt-1 text-sm text-estei-gray-600">Based on {product.reviewCount} reviews</p>
                <div className="mt-5 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = distribution[5 - star];
                    const pct = product.reviewCount > 0 ? Math.round((count / product.reviewCount) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-estei-gray-600">{star}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-estei-gray-100">
                          <div className="h-full rounded-full bg-estei-star" style={{ width: `${(count / maxShare) * 100}%` }} />
                        </div>
                        <span className="w-9 text-right text-estei-gray-400">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-2">
                {status === "authenticated" && (
                  <form onSubmit={submitReview} className="mb-6 rounded-lg border border-estei-gray-200 p-4">
                    <p className="mb-3 text-sm font-semibold text-estei-gray-900">Write a review</p>
                    <div className="mb-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReviewRating(s)} aria-label={`Rate ${s} stars`}>
                          <Star
                            className={cn("h-5 w-5", s <= reviewRating ? "fill-estei-star text-estei-star" : "text-estei-gray-200")}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} placeholder="Share your experience with this product..." />
                    <Button type="submit" className="mt-3" disabled={submittingReview}>
                      {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Submit Review
                    </Button>
                  </form>
                )}

                <div className="space-y-4">
                  {reviews.length === 0 && <p className="py-8 text-center text-sm text-estei-gray-400">No reviews yet.</p>}
                  {reviews.map((r) => (
                    <article key={r.id} className="flex gap-3 rounded-lg border border-estei-gray-200 p-4">
                      <Avatar>
                        <AvatarFallback>{r.authorName.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-estei-gray-900">{r.authorName}</p>
                          <span className="text-xs text-estei-gray-400">{relativeTime(r.createdAt)}</span>
                        </div>
                        <StarRating rating={r.rating} size={13} />
                        <p className="mt-2 text-sm leading-relaxed text-estei-gray-600">{r.body}</p>
                      </div>
                    </article>
                  ))}
                  {reviews.length < reviewsTotal && (
                    <div className="text-center">
                      <Button variant="outline" onClick={loadMoreReviews} disabled={loadingReviews}>
                        {loadingReviews ? "Loading..." : "Load more"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z" />
    </svg>
  );
}