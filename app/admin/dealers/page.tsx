"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { X, FileText, Loader2, UserCheck, UserX, FileSearch, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  DEALER_STATUSES,
  DEALER_STATUS_LABEL,
  DEALER_STATUS_TONE,
  DEALER_DOC_LABEL,
  MONTHLY_DEMAND_LABEL,
  type DealerStatus,
} from "@/lib/dealer-ui";
import { Button } from "@/components/ui/button";

type DealerRow = {
  id: string;
  refNumber: string;
  phone: string;
  businessLoc: string;
  packageName: string;
  monthlyDemand: string;
  status: DealerStatus;
  consentAt: string | null;
  docCount: number;
  createdAt: string;
};

type Page = { applications: DealerRow[]; total: number; page: number; pageCount: number };

type DocView = { url: string; expiresAt: string };

type DetailData = {
  id: string;
  refNumber: string;
  phone: string;
  businessLoc: string;
  monthlyDemand: string;
  status: DealerStatus;
  adminNote: string | null;
  consentAt: string | null;
  submittedAt: string;
  package: { name: string; description: string | null; minPairs: number; maxPairs: number | null };
  documents: {
    id: string;
    type: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
    view: DocView;
  }[];
};

const FILTERS: ("" | DealerStatus)[] = ["", ...DEALER_STATUSES];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDealersPage() {
  const [rows, setRows] = useState<DealerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filter, setFilter] = useState<"" | DealerStatus>("");
  const [loading, setLoading] = useState(true);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

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
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, filter);
  }, [page, filter, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function openDetail(id: string) {
    setOpenId(id);
    setDetail(null);
    setNote("");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/dealers/${id}`);
      const json = (await res.json()) as { ok: boolean; data?: DetailData };
      if (json.ok && json.data) {
        setDetail(json.data);
        setNote(json.data.adminNote ?? "");
      } else {
        toast.error("Failed to load application details");
        setOpenId(null);
      }
    } catch {
      toast.error("Failed to load application details");
      setOpenId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function setStatus(status: DealerStatus) {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/dealers/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update");
        return;
      }
      toast.success(`Application marked ${DEALER_STATUS_LABEL[status]}`);
      setDetail((d) => (d ? { ...d, status } : d));
      void load(page, filter);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-estei-gray-900">Dealer Applications</h1>
      <p className="mb-6 text-sm text-estei-gray-400">{total} total</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? "bg-estei-red text-white"
                : "border border-estei-gray-200 text-estei-gray-600 hover:border-estei-red hover:text-estei-red"
            }`}
          >
            {s === "" ? "All" : DEALER_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-estei-gray-200 bg-white shadow-card">
        {loading ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">No applications.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-estei-gray-100 text-left text-estei-gray-400">
                <th className="px-5 py-3 font-medium">Ref</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Package</th>
                <th className="px-5 py-3 font-medium">Demand</th>
                <th className="px-5 py-3 font-medium">Docs</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-estei-gray-100 last:border-0">
                  <td className="px-5 py-3 font-semibold text-estei-gray-900">{a.refNumber}</td>
                  <td className="px-5 py-3 text-estei-gray-600">{a.phone}</td>
                  <td className="px-5 py-3 text-estei-gray-600">{a.packageName}</td>
                  <td className="px-5 py-3 text-estei-gray-600">{MONTHLY_DEMAND_LABEL[a.monthlyDemand] ?? a.monthlyDemand}</td>
                  <td className="px-5 py-3 text-estei-gray-600">{a.docCount}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${DEALER_STATUS_TONE[a.status]}`}>
                      {DEALER_STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-estei-gray-400">{formatDate(a.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => void openDetail(a.id)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-estei-gray-400">
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {openId && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenId(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Application details"
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-estei-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-estei-gray-900">
                  {detail?.refNumber ?? "Application"}
                </h2>
                <p className="text-xs text-estei-gray-400">
                  {detail ? `Submitted ${formatDate(detail.submittedAt)}` : " "}
                </p>
              </div>
              <button
                onClick={() => setOpenId(null)}
                aria-label="Close"
                className="rounded-md p-2 text-estei-gray-400 transition-colors hover:bg-estei-gray-100 hover:text-estei-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {detailLoading || !detail ? (
                <p className="flex items-center gap-2 py-10 text-sm text-estei-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
              ) : (
                <>
                  <div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${DEALER_STATUS_TONE[detail.status]}`}>
                      {DEALER_STATUS_LABEL[detail.status]}
                    </span>
                  </div>

                  <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-estei-gray-400">Phone</dt>
                      <dd className="mt-0.5 font-semibold text-estei-gray-900">{detail.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-estei-gray-400">Sell Package</dt>
                      <dd className="mt-0.5 font-semibold text-estei-gray-900">
                        {detail.package.name}
                        <span className="block text-xs font-normal text-estei-gray-400">
                          {detail.package.description ?? `${detail.package.minPairs}–${detail.package.maxPairs ?? "800+"} pairs`} /month
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-estei-gray-400">Monthly Demand</dt>
                      <dd className="mt-0.5 font-semibold text-estei-gray-900">
                        {MONTHLY_DEMAND_LABEL[detail.monthlyDemand] ?? detail.monthlyDemand}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-estei-gray-400">Consent</dt>
                      <dd className="mt-0.5 font-semibold text-estei-gray-900">
                        {detail.consentAt ? formatDate(detail.consentAt) : "Not recorded"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-estei-gray-400">Business Location</dt>
                      <dd className="mt-0.5 text-estei-gray-600">{detail.businessLoc}</dd>
                    </div>
                  </dl>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-estei-gray-900">Uploaded Documents</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {detail.documents.map((d) => (
                        <div key={d.id} className="rounded-lg border border-estei-gray-200 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-estei-gray-900">
                              <FileText className="h-3.5 w-3.5 text-estei-red" />
                              {DEALER_DOC_LABEL[d.type] ?? d.type}
                            </p>
                            <span className="shrink-0 text-[0.65rem] text-estei-gray-400">{formatBytes(d.sizeBytes)}</span>
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element — signed, short-lived, admin-only URL */}
                          <img
                            src={d.view.url}
                            alt={`${DEALER_DOC_LABEL[d.type] ?? d.type} document`}
                            className="mt-2 max-h-40 w-full rounded object-contain bg-estei-gray-100"
                          />
                          <a
                            href={d.view.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-1 text-xs font-medium text-estei-red hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Open full size
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="admin-note" className="text-sm font-semibold text-estei-gray-900">
                      Admin note
                    </label>
                    <textarea
                      id="admin-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Note for the applicant / internal remarks"
                      className="w-full rounded-md border border-estei-gray-200 px-3 py-2 text-sm focus:border-estei-red focus:ring-1 focus:ring-estei-red focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {detail && !detailLoading && (
              <div className="border-t border-estei-gray-200 p-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void setStatus("APPROVED")} disabled={saving || detail.status === "APPROVED"}>
                    <UserCheck className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => void setStatus("VERIFIED")} disabled={saving || detail.status === "VERIFIED"}>
                    <UserCheck className="h-4 w-4" /> Mark Verified
                  </Button>
                  <Button variant="outline" onClick={() => void setStatus("DOCS_REVIEW")} disabled={saving || detail.status === "DOCS_REVIEW"}>
                    <FileSearch className="h-4 w-4" /> Request Docs
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-estei-red hover:bg-estei-red-tint"
                    onClick={() => void setStatus("REJECTED")}
                    disabled={saving || detail.status === "REJECTED"}
                  >
                    <UserX className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}