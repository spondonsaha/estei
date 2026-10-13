"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PRICE_RANGES, SORT_OPTIONS, MEN_SIZE_SET, WOMEN_SIZE_SET } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FilterPanel({ sizeSet, onApply }: { sizeSet: "mens" | "womens"; onApply?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const price = useMemo(() => (searchParams.get("price") ?? "").split(",").filter(Boolean), [searchParams]);
  const size = useMemo(() => (searchParams.get("size") ?? "").split(",").filter(Boolean), [searchParams]);
  const colour = searchParams.get("colour") ?? "";

  const [localPrice, setLocalPrice] = useState<string[]>(price);
  const [localSize, setLocalSize] = useState<string[]>(size);
  const [localColour, setLocalColour] = useState<string>(colour);

  const availableSizes = sizeSet === "womens" ? WOMEN_SIZE_SET : MEN_SIZE_SET;

  const buildUrl = useCallback(
    (next: { price?: string[]; size?: string[]; colour?: string; sort?: string }) => {
      const p = new URLSearchParams(searchParams.toString());
      const setMulti = (key: string, vals: string[]) => {
        if (vals.length === 0) p.delete(key);
        else p.set(key, vals.join(","));
      };
      setMulti("price", next.price ?? localPrice);
      setMulti("size", next.size ?? localSize);
      if (next.colour !== undefined) {
        if (next.colour) p.set("colour", next.colour);
        else p.delete("colour");
      }
      if (next.sort !== undefined) {
        if (next.sort && next.sort !== "featured") p.set("sort", next.sort);
        else p.delete("sort");
      }
      p.delete("page");
      return p.toString();
    },
    [searchParams, localPrice, localSize]
  );

  function applyFilters() {
    router.push(`?${buildUrl({})}`);
    onApply?.();
  }

  function clearAll() {
    router.push(window.location.pathname);
    onApply?.();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-estei-gray-900">Filter</h2>
        <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs font-medium text-estei-gray-400 hover:text-estei-red">
          <RotateCcw className="h-3 w-3" /> Clear all
        </button>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-estei-gray-900">Price Range</legend>
        <div className="space-y-2">
          {PRICE_RANGES.map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm text-estei-gray-600">
              <Checkbox
                checked={localPrice.includes(r.id)}
                onCheckedChange={(checked) =>
                  setLocalPrice(checked ? [...localPrice, r.id] : localPrice.filter((x) => x !== r.id))
                }
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-estei-gray-900">Size</legend>
        <div className="grid grid-cols-3 gap-2">
          {availableSizes.map((s) => (
            <label
              key={s}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm",
                localSize.includes(s)
                  ? "border-estei-red bg-estei-red-tint text-estei-red"
                  : "border-estei-gray-200 text-estei-gray-600"
              )}
            >
              <Checkbox
                checked={localSize.includes(s)}
                onCheckedChange={(checked) =>
                  setLocalSize(checked ? [...localSize, s] : localSize.filter((x) => x !== s))
                }
                className="hidden"
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-estei-gray-900">Colour</legend>
        <div className="grid grid-cols-6 gap-2">
          {[
            { name: "Black", hex: "#0D0D0D" },
            { name: "Navy", hex: "#1B2A4A" },
            { name: "Brown", hex: "#6B4226" },
            { name: "Olive", hex: "#556B2F" },
            { name: "Gray", hex: "#8A8A8A" },
            { name: "Silver", hex: "#C0C0C0" },
            { name: "Dark Red", hex: "#7A1C1C" },
            { name: "Maroon", hex: "#800000" },
            { name: "Red", hex: "#E01E26" },
            { name: "Pink", hex: "#F7B6C1" },
            { name: "Tan", hex: "#D2B48C" },
            { name: "Blue", hex: "#1E56A0" },
          ].map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={`Filter by ${c.name}`}
              onClick={() => setLocalColour(localColour === c.name ? "" : c.name)}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-shadow",
                localColour === c.name ? "ring-2 ring-estei-red ring-offset-2" : "border-estei-gray-200"
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </fieldset>
      <Button onClick={applyFilters} className="w-full">
        Apply Filters
      </Button>
    </div>
  );
}

export function SortSelect({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-estei-gray-600 sm:inline">Sort by:</span>
      <Select
        value={current ?? "featured"}
        onValueChange={(value) => {
          const p = new URLSearchParams(searchParams.toString());
          if (value === "featured") p.delete("sort");
          else p.set("sort", value);
          p.delete("page");
          router.push(`?${p.toString()}`);
        }}
      >
        <SelectTrigger className="w-40 sm:w-44">
          <SelectValue placeholder="Featured" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}