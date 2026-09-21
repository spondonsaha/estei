"use client";

import { useCallback, useRef, useState } from "react";
import { CloudUpload, IdCard, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_DOC_BYTES, ALLOWED_DOC_MIME } from "@/lib/dealer-ui";

export type UploadedDoc = {
  storageKey: string;
  fileName: string;
  sizeBytes: number;
  uploading: boolean;
  progress: number;
  error?: string;
};

type Props = {
  id?: string;
  label: string;
  helperId: string;
  helperText: string;
  dropLabel: string;
  maxFiles: number;
  files: UploadedDoc[];
  onChange: React.Dispatch<React.SetStateAction<UploadedDoc[]>>;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadFile(file: File, onProgress: (p: number) => void): Promise<{ storageKey: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/dealer/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as {
          ok: boolean;
          storageKey?: string;
          sizeBytes?: number;
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && json.ok && json.storageKey) {
          resolve({ storageKey: json.storageKey, sizeBytes: json.sizeBytes ?? file.size });
        } else {
          reject(new Error(json.error ?? "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(form);
  });
}

export function DocumentDropzone({
  label,
  helperId,
  helperText,
  dropLabel,
  maxFiles,
  files,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busyCount, setBusyCount] = useState(0);
  const [dropError, setDropError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      setDropError(null);

      const slotsLeft = maxFiles - files.length;
      if (slotsLeft <= 0) {
        setDropError(`You can upload up to ${maxFiles} files here. Remove one to add another.`);
        return;
      }

      const valid: File[] = [];
      const rejected: string[] = [];
      for (const f of list.slice(0, slotsLeft)) {
        if (!ALLOWED_DOC_MIME.has(f.type)) {
          rejected.push(`${f.name} (unsupported type)`);
          continue;
        }
        if (f.size > MAX_DOC_BYTES) {
          rejected.push(`${f.name} (over 5MB)`);
          continue;
        }
        valid.push(f);
      }

      if (rejected.length > 0) {
        setDropError(`Rejected: ${rejected.join(", ")}. Only JPG, PNG or WEBP under 5MB are accepted.`);
        if (valid.length === 0) return;
      }

      const startIndex = files.length;
      const entries: UploadedDoc[] = valid.map((f) => ({
        storageKey: "",
        fileName: f.name,
        sizeBytes: f.size,
        uploading: true,
        progress: 0,
      }));
      onChange((prev) => [...prev, ...entries]);
      setBusyCount((c) => c + valid.length);

      for (const [i, f] of valid.entries()) {
        const targetIndex = startIndex + i;
        try {
          const { storageKey, sizeBytes } = await uploadFile(f, (p) => {
            onChange((prev) =>
              prev.map((doc, di) => (di === targetIndex ? { ...doc, progress: p } : doc))
            );
          });
          onChange((prev) =>
            prev.map((doc, di) =>
              di === targetIndex ? { ...doc, storageKey, sizeBytes, uploading: false, progress: 100 } : doc
            )
          );
        } catch (err) {
          onChange((prev) =>
            prev.map((doc, di) =>
              di === targetIndex
                ? { ...doc, uploading: false, error: err instanceof Error ? err.message : "Upload failed" }
                : doc
            )
          );
        } finally {
          setBusyCount((c) => Math.max(0, c - 1));
        }
      }
    },
    [files, maxFiles, onChange]
  );

  const remove = useCallback(
    (index: number) => {
      onChange((prev) => prev.filter((_, i) => i !== index));
    },
    [onChange]
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
        <IdCard className="h-[18px] w-[18px] text-[#F01B24]" aria-hidden="true" />
        <span className="text-sm font-bold text-[#111827]">{label}</span>
        <span className="text-[#F01B24]" aria-hidden="true">*</span>
      </div>
      <p id={helperId} className="mb-3 text-[0.85rem] text-[#4A5568]">
        {helperText}
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label={dropLabel}
        aria-describedby={helperId}
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
          dragOver && "border-[#2B5CE6] bg-[#EEF3FE]"
        )}
      >
        <CloudUpload className="h-7 w-7 text-[#8A94A6]" aria-hidden="true" />
        <span className="text-[0.95rem] font-semibold text-[#2B5CE6]">{dropLabel}</span>
        <span className="text-xs text-[#8A94A6]">(JPG, PNG&nbsp;&nbsp;Max 5MB)</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
        {files.map((doc, index) => (
          <div key={`${doc.fileName}-${index}`} className="rounded-lg border border-[#ECEEF2] bg-[#F7F8FA] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#111827]">{doc.fileName}</p>
                <p className="text-[0.7rem] text-[#8A94A6]">{formatBytes(doc.sizeBytes)}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove ${doc.fileName}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#8A94A6] shadow-sm transition-colors hover:bg-[#FDEEF0] hover:text-[#F01B24]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {doc.uploading ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6EAF2]">
                <div
                  className="h-full rounded-full bg-[#2B5CE6] transition-[width]"
                  style={{ width: `${doc.progress}%` }}
                />
              </div>
            ) : doc.error ? (
              <p className="mt-1 text-xs font-medium text-[#F01B24]" role="alert">
                {doc.error} —{" "}
                <button type="button" className="underline" onClick={() => remove(index)}>
                  Remove
                </button>
              </p>
            ) : (
              <p className="mt-1 text-xs font-medium text-[#1E9E5A]">Uploaded — ready to submit</p>
            )}
          </div>
        ))}
      </div>

      {busyCount > 0 && (
        <p className="mt-2 flex items-center gap-2 text-xs text-[#4A5568]" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading {busyCount} file{busyCount === 1 ? "" : "s"}…
        </p>
      )}
    </div>
  );
}