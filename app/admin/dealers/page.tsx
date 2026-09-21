"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DealerRow = {
  id: string;
  status: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string | null;
  district: string;
  businessType: string;
  createdAt: string;
};

type Page = { applications: DealerRow[]; total: number; page: number; pageCount: number };

export default function AdminDealersPage() {
  const [rows, setRows] = useState<DealerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filter, setFilter] = useState<"" | "PENDING" | "APPROVED" | "REJECTED">("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (pageNum: number, status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dealers?page=${pageNum}&status=${status}`);
      const json = (await res.json()) as { ok: boolean; data?: Page };
      if (json.ok && json.data) {
        setRows(json.data.applications);
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
    const res = await fetch(`/api/admin/dealers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update");
      return;
    }
    toast.success(`Application ${status.toLowerCase()}`);
    void load(page, filter);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-estei-gray-900">Dealer Applications</h1>
      <p className="mb-6 text-sm text-estei-gray-400">{total} total</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === s ? "bg-estei-red text-white" : "border border-estei-gray-200 text-estei-gray-600 hover:border-estei-red hover:text-estei-red"}`}
          >
            {s === "" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-estei-gray-200 p-8 text-center text-sm text-estei-gray-400">No applications.</p>
        ) : (
          rows.map((a) => (
            <div key={a.id} className="rounded-lg border border-estei-gray-200 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-estei-gray-900">{a.businessName}</p>
                  <p className="text-xs text-estei-gray-400">
                    {a.ownerName} • {a.businessType} • {a.district} • {a.phone} {a.email ? `• ${a.email}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => void setStatus(a.id, "APPROVED")}>Approve</Button>
                      <Button variant="outline" size="sm" onClick={() => void setStatus(a.id, "REJECTED")}>Reject</Button>
                    </>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.status === "APPROVED" ? "bg-estei-success/10 text-estei-success" : a.status === "REJECTED" ? "bg-estei-risk/10 text-estei-risk" : "bg-estei-red-tint text-estei-red"}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-estei-gray-400">Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}