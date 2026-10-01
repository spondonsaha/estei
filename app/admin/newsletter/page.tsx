"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

type SubscriberRow = { id: string; email: string; createdAt: string };

type Page = { rows: SubscriberRow[]; total: number; page: number; pageCount: number };

export default function AdminNewsletterPage() {
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (pageNum: number, query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter?page=${pageNum}&q=${encodeURIComponent(query)}`);
      const json = (await res.json()) as { ok: boolean; data?: Page };
      if (json.ok && json.data) {
        setRows(json.data.rows);
        setTotal(json.data.total);
        setPage(json.data.page);
        setPageCount(json.data.pageCount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, q);
  }, [page, q, load]);

  async function remove(id: string, email: string) {
    if (!window.confirm(`Remove ${email}?`)) return;
    const res = await fetch(`/api/admin/newsletter`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed to remove");
      return;
    }
    toast.success("Subscriber removed");
    void load(page, q);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-estei-gray-900">Newsletter Subscribers</h1>
          <p className="text-sm text-estei-gray-400">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-estei-gray-200 px-3">
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search email..."
              className="w-44 border-0 focus-visible:ring-0"
            />
          </div>
          <Button variant="outline" asChild>
            <a href="/api/admin/newsletter?export=csv" download>Export CSV</a>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-estei-gray-200 bg-white shadow-card">
        {loading ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">No subscribers.</p>
        ) : (
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-estei-gray-100 text-left text-estei-gray-400">
                <th className="px-4 py-3 font-medium sm:px-5">Email</th>
                <th className="px-4 py-3 font-medium sm:px-5">Subscribed</th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-estei-gray-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-estei-gray-900 sm:px-5">{s.email}</td>
                  <td className="px-4 py-3 text-estei-gray-400 sm:px-5">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right sm:px-5">
                    <Button variant="outline" size="sm" onClick={() => void remove(s.id, s.email)}>Remove</Button>
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