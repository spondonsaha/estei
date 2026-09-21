"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, subtotal, count, updateItem, removeItem, loading } = useCart();
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button className="absolute inset-0 h-full w-full cursor-default bg-estei-black/50" onClick={onClose} aria-hidden="true" tabIndex={-1} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-estei-gray-200 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-estei-gray-900">
            <ShoppingBag className="h-5 w-5 text-estei-red" />
            Your Cart ({count})
          </h2>
          <button onClick={onClose} className="rounded p-1 text-estei-gray-400 hover:text-estei-gray-900" aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-estei-gray-400">Loading cart...</p>
          ) : lines.length === 0 ? (
            <div className="py-14 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-estei-gray-200" />
              <p className="mt-3 text-sm text-estei-gray-600">Your cart is empty</p>
              <Button variant="outline" className="mt-4" onClick={() => { onClose(); router.push("/category/mens"); }}>
                Start Shopping
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3 border-b border-estei-gray-100 pb-4">
                  <Link href={`/product/${line.slug}`} onClick={onClose} className="shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-md bg-estei-gray-100">
                      <Image src={line.image} alt={line.productName} fill sizes="80px" className="object-cover" />
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${line.slug}`} onClick={onClose} className="line-clamp-2 text-sm font-semibold text-estei-gray-900 hover:text-estei-red">
                        {line.productName}
                      </Link>
                      <button onClick={() => void removeItem(line.id)} className="text-estei-gray-400 hover:text-estei-red" aria-label={`Remove ${line.productName}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-estei-gray-400">
                      {line.colourName} · Size {line.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-md border border-estei-gray-200 px-1 py-0.5">
                        <button
                          onClick={() => void updateItem(line.id, Math.max(1, line.quantity - 1))}
                          className="p-1 disabled:opacity-40"
                          disabled={line.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                        <button
                          onClick={() => void updateItem(line.id, line.quantity + 1)}
                          className="p-1"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-estei-red">
                        {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(line.unitPrice) * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-estei-gray-200 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-estei-gray-600">Subtotal</span>
              <span className="text-base font-bold text-estei-gray-900">{subtotal}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { onClose(); router.push("/cart"); }}>
                View Cart
              </Button>
              <Button className={cn("bg-estei-red text-white hover:bg-estei-red-hover")} onClick={() => { onClose(); router.push("/checkout"); }}>
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}