"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, CartView } from "@/lib/types";

const SESSION_KEY = "estei_session_id";
const CART_SYNC_KEY = "estei_cart_synced";

type CartContextValue = {
  sessionId: string | null;
  lines: CartLine[];
  count: number;
  subtotal: string;
  subtotalRaw: number;
  loading: boolean;
  addItem: (productId: string, variantId: string, quantity: number) => Promise<void>;
  updateItem: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  synced: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as T;
  return json;
}

function makeSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `sess_${crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}

type CartState = { sessionId: string; synced: boolean };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ sessionId: "", synced: true });
  const [view, setView] = useState<CartView>({ lines: [], subtotal: "৳0", count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = makeSessionId();
    const synced = window.localStorage.getItem(CART_SYNC_KEY) === "1";
    setState({ sessionId, synced });
    setLoading(false);
  }, []);

  const buildHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      "x-session-id": state.sessionId,
    };
  }, [state.sessionId]);

  const refresh = useCallback(async () => {
    if (!state.sessionId) return;
    try {
      const res = await fetch(`/api/cart?sessionId=${state.sessionId}`, { headers: buildHeaders() });
      const data = (await res.json()) as { ok: boolean; data?: CartView; error?: string };
      if (data.ok && data.data) setView(data.data);
    } catch {
      // ignore transient network errors
    }
  }, [state.sessionId, buildHeaders]);

  useEffect(() => {
    if (!state.sessionId) return;
    void refresh();
  }, [state.sessionId, refresh]);

  const addItem = useCallback(
    async (productId: string, variantId: string, quantity: number) => {
      const res = await request<{ ok: boolean; data?: CartView; error?: string }>(`/api/cart`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ productId, variantId, quantity }),
      });
      if (res.ok && res.data) setView(res.data);
    },
    [buildHeaders]
  );

  const updateItem = useCallback(
    async (id: string, quantity: number) => {
      const res = await request<{ ok: boolean; data?: CartView; error?: string }>(`/api/cart/${id}`, {
        method: "PATCH",
        headers: buildHeaders(),
        body: JSON.stringify({ quantity }),
      });
      if (res.ok && res.data) setView(res.data);
    },
    [buildHeaders]
  );

  const removeItem = useCallback(
    async (id: string) => {
      const res = await request<{ ok: boolean; data?: CartView; error?: string }>(`/api/cart/${id}`, {
        method: "DELETE",
        headers: buildHeaders(),
      });
      if (res.ok && res.data) setView(res.data);
    },
    [buildHeaders]
  );

  const clear = useCallback(async () => {
    const res = await request<{ ok: boolean; error?: string }>(`/api/cart/clear`, {
      method: "DELETE",
      headers: buildHeaders(),
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
    if (res.ok) setView({ lines: [], subtotal: "৳0", count: 0 });
  }, [buildHeaders, state.sessionId]);

  const value = useMemo<CartContextValue>(
    () => ({
      sessionId: state.sessionId,
      lines: view.lines,
      count: view.count,
      subtotal: view.subtotal,
      subtotalRaw: Number(
        view.lines.reduce((acc, l) => acc + Number(l.unitPrice) * l.quantity, 0)
      ),
      loading,
      addItem,
      updateItem,
      removeItem,
      clear,
      refresh,
      synced: state.synced,
    }),
    [state.sessionId, state.synced, view, loading, addItem, updateItem, removeItem, clear, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}