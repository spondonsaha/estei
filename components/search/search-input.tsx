"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import type { ProductCardData } from "@/lib/types";

export function ProductSearchInput({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{ name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const run = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=6&page=1`);
      const json = (await res.json()) as { ok: boolean; data?: { products: ProductCardData[] } };
      if (json.ok) setResults((json.data?.products ?? []).map((p) => ({ name: p.name, slug: p.slug })));
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }}
        className="flex items-center gap-2 rounded-md border border-estei-gray-200 bg-white px-3"
      >
        <Search className="h-4 w-4 shrink-0 text-estei-gray-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            run(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Try 'runner' or 'formal'..."
          className="border-0 focus-visible:ring-0"
        />
        <button type="submit" className="text-sm font-semibold text-estei-red">
          Search
        </button>
      </form>
      {open && query.trim() && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-estei-gray-200 bg-white p-2 shadow-card">
          {loading ? (
            <p className="px-3 py-2 text-sm text-estei-gray-400">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-estei-gray-400">No matches</p>
          ) : (
            results.map((r) => (
              <button
                key={r.slug}
                onClick={() => {
                  setOpen(false);
                  router.push(`/product/${r.slug}`);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-estei-gray-900 hover:bg-estei-gray-100"
              >
                {r.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}