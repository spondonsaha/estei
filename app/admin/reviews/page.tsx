"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shared/star-rating";

type ReviewRow = {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  product: { name: string; slug: string };
  user: { name: string | null; email: string } | null;
  isApproved: boolean;
  createdAt: string;
};

type Page = { reviews: ReviewRow[]; total: number; page: number; pageCount: number };

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?page=${pageNum}`);
      const json = (await res.json()) as { ok: boolean; data?: Page };
      if (json.ok && json.data) {
        setRows(json.data.reviews);
        setTotal(json.data.total);
        setPage(json.data.page);
        setPageCount(json.data.pageCount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [page, load]);

  async function toggle(id: string, approved: boolean) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: approved }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update");
      return;
    }
    toast.success(approved ? "Review approved" : "Review hidden");
    void load(page);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this review permanently?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed to delete");
      return;
    }
    toast.success("Review deleted");
    void load(page);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-estei-gray-900">Reviews</h1>
        <p className="text-sm text-estei-gray-400">{total} total</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-estei-gray-200 p-8 text-center text-sm text-estei-gray-400">No reviews.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-lg border border-estei-gray-200 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StarRating rating={Number(r.rating)} size={16} />
                  <p className="font-semibold text-estei-gray-900">{r.user?.name ?? r.user?.email ?? r.authorName}</p>
                  <span className="text-xs text-estei-gray-400">on {r.product.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void toggle(r.id, !r.isApproved)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${r.isApproved ? "bg-estei-success/10 text-estei-success" : "bg-estei-gray-100 text-estei-gray-400"}`}
                  >
                    {r.isApproved ? "Visible" : "Hidden"}
                  </button>
                  <Button variant="outline" size="sm" onClick={() => void remove(r.id)}>Delete</Button>
                </div>
              </div>
              <p className="mt-2 text-sm text-estei-gray-700">{r.comment ?? <span className="italic text-estei-gray-400">No comment.</span>}</p>
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