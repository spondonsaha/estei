"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  variantId: string;
  size: string;
  initialStock: number;
  onChange?: (stock: number) => void;
};

export function StockStepper({ productId, variantId, size, initialStock, onChange }: Props) {
  const [stock, setStock] = useState(initialStock);
  const [pending, startTransition] = useTransition();

  function step(delta: number) {
    const next = stock + delta;
    if (next < 0) return;
    const previous = stock;
    setStock(next);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delta }),
        });
        const json = (await res.json()) as { ok: boolean; error?: string; data?: { stock: number } };
        if (!res.ok) {
          setStock(previous);
          toast.error(json.error ?? "Failed to update stock");
          return;
        }
        setStock(json.data?.stock ?? next);
        onChange?.(json.data?.stock ?? next);
      } catch {
        setStock(previous);
        toast.error("Failed to update stock");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={pending || stock === 0}
        aria-label={`Decrease stock for size ${size}`}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border border-estei-gray-200 text-estei-gray-600 transition-colors hover:border-estei-red hover:text-estei-red disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-estei-gray-200 disabled:hover:text-estei-gray-600",
          pending && "opacity-60"
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className={cn(
          "w-12 text-center text-sm font-semibold tabular-nums",
          stock === 0 ? "text-estei-red" : "text-estei-gray-900"
        )}
      >
        {stock}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={pending}
        aria-label={`Increase stock for size ${size}`}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border border-estei-gray-200 text-estei-gray-600 transition-colors hover:border-estei-red hover:text-estei-red disabled:cursor-not-allowed disabled:opacity-40",
          pending && "opacity-60"
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
