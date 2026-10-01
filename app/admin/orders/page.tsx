"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatDate } from "@/lib/utils";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  district: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  city: string | null;
  area: string | null;
  thana: string | null;
  postalCode: string | null;
  notes: string | null;
  total: string;
  createdAt: string;
  itemCount: number;
};

function formatAddress(o: OrderRow): string {
  return [
    o.addressLine,
    [o.area, o.city].filter(Boolean).join(", "),
    o.thana ? `${o.thana} Thana` : "",
    [o.postalCode, o.district].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join("\n");
}

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

type Page = { orders: OrderRow[]; total: number; page: number; pageCount: number };

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (pageNum: number, status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${pageNum}&status=${status}`);
      const json = (await res.json()) as { ok: boolean; data?: Page };
      if (json.ok && json.data) {
        setRows(json.data.orders);
        setTotal(json.data.total);
        setPage(json.data.page);
        setPageCount(json.data.pageCount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, filter);
  }, [page, filter, load]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update");
      return;
    }
    toast.success("Order updated");
    void load(page, filter);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-estei-gray-900">Orders</h1>
          <p className="text-sm text-estei-gray-400">{total} orders</p>
        </div>
        <Select value={filter || "ALL"} onValueChange={(v) => { setFilter(v === "ALL" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-estei-gray-200 bg-white shadow-card">
        {loading ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">No orders found.</p>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-estei-gray-100 text-left text-estei-gray-400">
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Delivery Address</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-estei-gray-100 last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/order/${o.orderNumber}`} className="font-semibold text-estei-red hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-estei-gray-900">{o.name ?? "—"}</p>
                    {o.email && <p className="text-xs text-estei-gray-400">{o.email}</p>}
                    {o.notes && (
                      <p className="mt-1 max-w-[16rem] truncate text-xs italic text-estei-gray-400" title={o.notes}>
                        Note: {o.notes}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-estei-gray-600">{o.phone ?? "—"}</td>
                  <td className="px-5 py-3">
                    <p className="whitespace-pre-line text-xs leading-relaxed text-estei-gray-600">
                      {formatAddress(o)}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-estei-gray-600">{o.itemCount}</td>
                  <td className="px-5 py-3 text-estei-gray-600">{o.paymentMethod}</td>
                  <td className="px-5 py-3 font-bold text-estei-red">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 text-estei-gray-400">{formatDate(o.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Select value={o.status} onValueChange={(v) => void setStatus(o.id, v)}>
                      <SelectTrigger className="h-8 w-32 text-xs" aria-label="Change status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-estei-gray-100 px-5 py-3 text-sm">
            <span className="text-estei-gray-400">Page {page} of {pageCount}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}