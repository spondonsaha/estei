"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "@/components/shared/product-card";
import { Input } from "@/components/ui/input";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const runSearch = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q.trim())}&page=1&limit=8`);
      const json = (await res.json()) as { ok: boolean; data?: { products: ProductCardData[] } };
      if (json.ok) setResults(json.data?.products ?? []);
    } finally {
      setLoading(false);
    }
  }, 300);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search products">
      <button
        className="absolute inset-0 h-full w-full cursor-default bg-estei-black/70"
        onClick={onClose}
        aria-label="Close search"
      />
      <div className="relative mx-auto mt-16 w-full max-w-2xl px-4">
        <div className="rounded-lg bg-white p-4 shadow-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }}
            className="flex items-center gap-2"
          >
            <Search className="h-5 w-5 shrink-0 text-estei-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                runSearch(e.target.value);
              }}
              placeholder="Search for products..."
              className="border-none text-base focus-visible:ring-0 focus-visible:outline-none"
            />
            <button type="submit" className="btn-primary shrink-0 !py-2" aria-label="Submit search">
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-3 border-t border-estei-gray-200 pt-3">
            {loading ? (
              <p className="px-2 py-4 text-sm text-estei-gray-400">Searching...</p>
            ) : query.trim() && results.length === 0 ? (
              <p className="px-2 py-4 text-sm text-estei-gray-400">No products found.</p>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {results.map((p) => (
                  <div key={p.id}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-2 py-4 text-sm text-estei-gray-400">
                Search for &quot;runner&quot;, &quot;formal&quot;, &quot;sports&quot;...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}