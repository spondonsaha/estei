"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterPanel } from "@/components/category/filter-panel";

export function CategoryFilters({ sizeSet }: { sizeSet: "mens" | "womens" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="lg:hidden inline-flex items-center gap-2 rounded-md border border-estei-gray-200 bg-white px-4 py-2 text-sm font-medium text-estei-gray-900"
        onClick={() => setOpen(true)}
        aria-label="Open filters"
        aria-expanded={open}
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 h-full w-full bg-estei-black/60" onClick={() => setOpen(false)} aria-label="Close filters" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filters</h2>
              <button onClick={() => setOpen(false)} className="rounded p-2 hover:bg-estei-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel sizeSet={sizeSet} onApply={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}