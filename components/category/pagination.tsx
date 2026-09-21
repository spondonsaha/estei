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
      {pages.map((p) => (
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
      ))}
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