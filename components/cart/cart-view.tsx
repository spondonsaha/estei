"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";

export function CartView() {
  const {
    lines,
    subtotal,
    subtotalRaw,
    updateItem,
    removeItem,
    clear,
    loading,
    error,
    clearError,
  } = useCart();
  const router = useRouter();

  if (loading) {
    return <div className="py-20 text-center text-sm text-estei-gray-400">Loading cart...</div>;
  }

  const outOfStockCount = lines.filter((l) => l.stock === 0).length;

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-estei-gray-200" />
        <h1 className="mt-4 text-2xl font-bold text-estei-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-estei-gray-400">Looks like you haven&apos;t added anything yet.</p>
        <Button className="mt-6" onClick={() => router.push("/category/mens")}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start justify-between gap-3 rounded-md bg-estei-red-tint px-4 py-3 text-sm font-medium text-estei-red"
          >
            <span>{error}</span>
            <button onClick={clearError} className="shrink-0 font-semibold underline" aria-label="Dismiss">
              Dismiss
            </button>
          </div>
        )}
        <div className="overflow-hidden rounded-lg border border-estei-gray-200 bg-white">
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-estei-gray-200 bg-estei-gray-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-estei-gray-400 md:grid">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span className="text-right">Total</span>
          </div>
          <ul className="divide-y divide-estei-gray-100">
            {lines.map((line) => {
              const outOfStock = line.stock === 0;
              const exceedsStock = !outOfStock && line.stock < line.quantity;
              return (
              <li key={line.id} className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center md:gap-4">
                <div className="flex gap-3">
                  <Link href={`/product/${line.slug}`} className="shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-md bg-estei-gray-100">
                      <Image src={line.image} alt={line.productName} fill sizes="80px" className="object-cover" />
                    </div>
                  </Link>
                  <div>
                    <Link href={`/product/${line.slug}`} className="font-semibold text-estei-gray-900 hover:text-estei-red">
                      {line.productName}
                    </Link>
                    <p className="mt-1 text-xs text-estei-gray-400">
                      {line.colourName} · Size {line.size}
                    </p>
                    {outOfStock && (
                      <p className="mt-1 inline-block rounded bg-estei-red-tint px-2 py-0.5 text-xs font-semibold text-estei-red">
                        Out of stock
                      </p>
                    )}
                    {exceedsStock && (
                      <p className="mt-1 inline-block rounded bg-estei-red-tint px-2 py-0.5 text-xs font-semibold text-estei-red">
                        Only {line.stock} left
                      </p>
                    )}
                    <button
                      onClick={() => void removeItem(line.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-estei-gray-400 hover:text-estei-red"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-estei-gray-600">
                  {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(line.unitPrice))}
                </p>
                <div className="flex w-fit items-center gap-2 rounded-md border border-estei-gray-200 px-1">
                  <button onClick={() => void updateItem(line.id, Math.max(1, line.quantity - 1))} className="p-2 disabled:opacity-40" disabled={line.quantity <= 1} aria-label="Decrease quantity">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                  <button
                    onClick={() => void updateItem(line.id, line.quantity + 1)}
                    className="p-2 disabled:opacity-40"
                    disabled={line.quantity >= line.stock}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-right text-base font-bold text-estei-red">
                  {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(line.unitPrice) * line.quantity)}
                </p>
              </li>
              );
            })}
          </ul>
          <div className="border-t border-estei-gray-200 px-6 py-4 text-right">
            <button onClick={() => void clear()} className="text-xs font-medium text-estei-gray-400 hover:text-estei-red">
              Clear cart
            </button>
          </div>
        </div>
      </div>

      <div className="h-fit rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-estei-gray-900">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-estei-gray-600">
            <span>Subtotal ({subtotalRaw > 0 ? lines.reduce((a, l) => a + l.quantity, 0) : 0} items)</span>
            <span className="font-medium text-estei-gray-900">{subtotal}</span>
          </div>
          <div className="flex justify-between text-estei-gray-600">
            <span>Delivery</span>
            <span className="font-medium text-estei-gray-900">Calculated at checkout</span>
          </div>
        </div>
        {outOfStockCount > 0 && (
          <p className="mt-3 text-center text-xs font-medium text-estei-red">
            Remove the {outOfStockCount === 1 ? "out of stock item" : `${outOfStockCount} out of stock items`} to continue
          </p>
        )}
        <Button
          size="lg"
          className="mt-6 w-full"
          disabled={outOfStockCount > 0}
          onClick={() => router.push("/checkout")}
        >
          Proceed to Checkout →
        </Button>
        <Link href="/category/mens" className="mt-3 block text-center text-sm font-medium text-estei-red hover:underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}