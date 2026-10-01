"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  CloudUpload,
  ImageIcon,
  Loader2,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_PRODUCT_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export type ProductImageEntry = {
  /** Empty until the upload finishes. */
  url: string;
  storageKey: string;
  fileName: string;
  /** Source file size while uploading, stored size once normalised. */
  bytes: number;
  alt: string;
  colour: string;
  uploading: boolean;
  progress: number;
  error?: string;
  /** True when loaded from the database rather than uploaded this session. */
  persisted: boolean;
};

type Stored = { url: string; storageKey: string; width: number; height: number; bytes: number };

type Props = {
  sku: string;
  colourOptions: string[];
  images: ProductImageEntry[];
  onChange: React.Dispatch<React.SetStateAction<ProductImageEntry[]>>;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadFile(
  file: File,
  sku: string,
  onProgress: (p: number) => void,
): Promise<Stored> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("files", file);
    form.append("sku", sku);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/products/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as {
          ok: boolean;
          data?: Stored[];
          error?: string;
        };
        const first = json.data?.[0];
        if (xhr.status >= 200 && xhr.status < 300 && json.ok && first) {
          resolve(first);
        } else {
          reject(new Error(json.error ?? "Upload failed"));
        }
      } catch {
        reject(new Error(`Upload failed (HTTP ${xhr.status || "network"})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(form);
  });
}

/**
 * Best-effort removal of an asset that was uploaded this session but will never
 * be attached to a product. Failures are swallowed: a stranded asset costs a
 * fraction of a credit, while surfacing an error here would block the admin's
 * actual task.
 */
async function discard(storageKey: string): Promise<void> {
  if (!storageKey) return;
  try {
    await fetch("/api/admin/products/upload/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storageKeys: [storageKey] }),
    });
  } catch {
    /* ignore */
  }
}

export function ProductImageUploader({
  sku,
  colourOptions,
  images,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busyCount, setBusyCount] = useState(0);
  const [dropError, setDropError] = useState<string | null>(null);

  const patch = useCallback(
    (index: number, changes: Partial<ProductImageEntry>) => {
      onChange((prev) =>
        prev.map((img, i) => (i === index ? { ...img, ...changes } : img)),
      );
    },
    [onChange],
  );

  const addFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      setDropError(null);

      const slotsLeft = MAX_PRODUCT_IMAGES - images.length;
      if (slotsLeft <= 0) {
        setDropError(
          `You can upload up to ${MAX_PRODUCT_IMAGES} images. Remove one to add another.`,
        );
        return;
      }

      const valid: File[] = [];
      const rejected: string[] = [];
      for (const f of list.slice(0, slotsLeft)) {
        if (!ACCEPT.split(",").includes(f.type)) {
          rejected.push(`${f.name} (unsupported type)`);
        } else if (f.size > MAX_BYTES) {
          rejected.push(`${f.name} (over 5MB)`);
        } else {
          valid.push(f);
        }
      }

      if (list.length > slotsLeft) {
        setDropError(`Only ${slotsLeft} more image(s) fit in this gallery.`);
      }
      if (rejected.length > 0) {
        const note = `Rejected: ${rejected.join(", ")}. Only JPG, PNG or WEBP under 5MB are accepted.`;
        setDropError((prev) => (prev ? `${prev} ${note}` : note));
      }
      if (valid.length === 0) return;

      const startIndex = images.length;
      onChange((prev) => [
        ...prev,
        ...valid.map((f) => ({
          url: "",
          storageKey: "",
          fileName: f.name,
          bytes: f.size,
          alt: "",
          colour: colourOptions[0] ?? "",
          uploading: true,
          progress: 0,
          persisted: false,
        })),
      ]);
      setBusyCount((c) => c + valid.length);

      for (const [i, f] of valid.entries()) {
        const target = startIndex + i;
        try {
          const stored = await uploadFile(f, sku, (p) =>
            patch(target, { progress: p }),
          );
          patch(target, {
            url: stored.url,
            storageKey: stored.storageKey,
            bytes: stored.bytes || f.size,
            uploading: false,
            progress: 100,
          });
        } catch (err) {
          patch(target, {
            uploading: false,
            error: err instanceof Error ? err.message : "Upload failed",
          });
        } finally {
          setBusyCount((c) => Math.max(0, c - 1));
        }
      }
    },
    [images.length, colourOptions, onChange, patch, sku],
  );

  const remove = useCallback(
    (index: number) => {
      const target = images[index];
      onChange((prev) => prev.filter((_, i) => i !== index));
      // Images loaded from the database are destroyed by the PATCH handler once
      // it knows they were dropped. Session uploads have no such handler yet.
      if (target && !target.persisted) void discard(target.storageKey);
    },
    [images, onChange],
  );

  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      const next = index + direction;
      if (next < 0 || next >= images.length) return;
      onChange((prev) => {
        const copy = [...prev];
        const [row] = copy.splice(index, 1);
        copy.splice(next, 0, row);
        return copy;
      });
    },
    [images.length, onChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="rounded-xl border border-[#ECEEF2] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="h-[18px] w-[18px] text-[#F01B24]" aria-hidden="true" />
        <span className="text-sm font-bold text-[#111827]">Product images</span>
      </div>
      <p id="product-images-helper" className="mb-3 text-[0.85rem] text-[#4A5568]">
        The first image is used as the product thumbnail. Up to {MAX_PRODUCT_IMAGES} images.
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
        aria-describedby="product-images-helper"
        onClick={() => inputRef.current?.click()}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex h-[110px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed border-[#C9D2E0] bg-[#F6F9FE] text-center transition-colors focus-visible:ring-2 focus-visible:ring-[#F01B24] focus-visible:ring-offset-1",
          dragOver && "border-[#2B5CE6] bg-[#EEF3FE]",
        )}
      >
        <CloudUpload className="h-7 w-7 text-[#8A94A6]" aria-hidden="true" />
        <span className="text-[0.95rem] font-semibold text-[#2B5CE6]">
          Drop images here or click to browse
        </span>
        <span className="text-xs text-[#8A94A6]">(JPG, PNG, WEBP&nbsp;&nbsp;Max 5MB)</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {dropError && (
        <p className="mt-2 text-xs font-medium text-[#F01B24]" role="alert">
          {dropError}
        </p>
      )}

      <div className="mt-3 space-y-2" aria-live="polite">
        {images.map((img, index) => (
          <div
            key={img.storageKey || `${img.fileName}-${index}`}
            className="rounded-lg border border-[#ECEEF2] bg-[#F7F8FA] p-3"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#E6EAF2]">
                {img.url ? (
                  <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[#8A94A6]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-[#111827]">
                    {img.fileName}
                  </p>
                  {index === 0 && !img.uploading && !img.error && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF4E5] px-2 py-0.5 text-[0.65rem] font-bold text-[#B45309]">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Main
                    </span>
                  )}
                </div>
                {img.bytes > 0 && (
                  <p className="text-[0.7rem] text-[#8A94A6]">{formatBytes(img.bytes)}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`alt-${index}`}>
                    Alt text for image {index + 1}
                  </label>
                  <input
                    id={`alt-${index}`}
                    type="text"
                    value={img.alt}
                    maxLength={200}
                    placeholder="Alt text (describe the shoe)"
                    onChange={(e) => patch(index, { alt: e.target.value })}
                    className="min-w-0 flex-1 rounded-md border border-[#E6EAF2] bg-white px-2 py-1 text-xs text-[#111827] outline-none focus:border-[#2B5CE6]"
                  />

                  {colourOptions.length > 0 && (
                    <>
                      <label className="sr-only" htmlFor={`colour-${index}`}>
                        Colour for image {index + 1}
                      </label>
                      <select
                        id={`colour-${index}`}
                        value={img.colour}
                        onChange={(e) => patch(index, { colour: e.target.value })}
                        className="rounded-md border border-[#E6EAF2] bg-white px-2 py-1 text-xs text-[#111827] outline-none focus:border-[#2B5CE6]"
                      >
                        <option value="">No colour</option>
                        {colourOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move image ${index + 1} earlier`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#4A5568] shadow-sm disabled:opacity-40"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label={`Move image ${index + 1} later`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#4A5568] shadow-sm disabled:opacity-40"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove ${img.fileName}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#8A94A6] shadow-sm transition-colors hover:bg-[#FDEEF0] hover:text-[#F01B24]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {img.uploading ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6EAF2]">
                <div
                  className="h-full rounded-full bg-[#2B5CE6] transition-[width]"
                  style={{ width: `${img.progress}%` }}
                />
              </div>
            ) : img.error ? (
              <p className="mt-1 text-xs font-medium text-[#F01B24]" role="alert">
                {img.error} —{" "}
                <button type="button" className="underline" onClick={() => remove(index)}>
                  Remove
                </button>
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {busyCount > 0 && (
        <p className="mt-2 flex items-center gap-2 text-xs text-[#4A5568]" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading {busyCount} image
          {busyCount === 1 ? "" : "s"}…
        </p>
      )}
    </div>
  );
}