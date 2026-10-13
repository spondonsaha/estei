"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import type { ProductCardData } from "@/lib/types";

export function RelatedProductsCarousel({ products }: { products: ProductCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdgeState = useCallback((el: HTMLDivElement) => {
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (el) updateEdgeState(el);
    const onResize = () => {
      const node = trackRef.current;
      if (node) updateEdgeState(node);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateEdgeState]);

  const scrollByPage = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }, []);

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-estei-gray-900 sm:text-2xl">You May Also Like</h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Previous products"
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-estei-gray-200 bg-white text-estei-gray-900 transition-colors hover:bg-estei-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next products"
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-estei-gray-200 bg-white text-estei-gray-900 transition-colors hover:bg-estei-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={(e) => updateEdgeState(e.currentTarget)}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-1"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[45%] lg:w-[31%] xl:w-[23.5%]">
            <ProductCard product={p} compact />
          </div>
        ))}
      </div>
    </section>
  );
}