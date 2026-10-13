"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function go(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  function visiblePages(): (number | "…")[] {
    if (pageCount <= 7) return pages;
    const candidates = new Set([1, 2, page - 1, page, page + 1, pageCount - 1, pageCount]);
    const sorted = [...candidates].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    let prev = 0;
    for (const p of sorted) {
      if (p - prev > 1) out.push("…");
      out.push(p);
      prev = p;
    }
    return out;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-estei-gray-200 text-estei-gray-600 disabled:opacity-40 hover:border-estei-red hover:text-estei-red"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {visiblePages().map((p) =>
        p === "…" ? (
          <span key={`gap-${p}`} className="flex h-10 items-center px-1 text-sm text-estei-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "h-10 w-10 rounded-md border text-sm font-medium transition-colors",
              p === page
                ? "border-estei-red bg-estei-red text-white"
                : "border-estei-gray-200 text-estei-gray-600 hover:border-estei-red hover:text-estei-red"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => go(page + 1)}
        disabled={page >= pageCount}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-estei-gray-200 text-estei-gray-600 disabled:opacity-40 hover:border-estei-red hover:text-estei-red"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}