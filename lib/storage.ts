import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Private document storage.
 *
 * Files are stored under {ROOT}/private/dealer-docs and are NEVER exposed
 * through a public URL. The only way to read them is via a short-lived,
 * HMAC-signed, admin-gated route (see app/api/admin/dealer-docs/[id]/route.ts).
 * Swap `saveDoc`/`readDoc` for Vercel Blob (private) or S3/R2 (private bucket)
 * in production — callers only touch `storageKey`.
 */

const STORAGE_ROOT = path.join(process.cwd(), "private", "dealer-docs");

const SIGN_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-estei-change-me";

export const DOC_VIEW_TTL_MS = 60_000;

function safeName(key: string): string {
  const base = path.basename(key);
  return base.replace(/[^a-zA-Z0-9._-]/g, "");
}

function filePath(storageKey: string): string {
  return path.join(STORAGE_ROOT, safeName(storageKey));
}

export type StoredDoc = {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
};

export async function saveDoc(buffer: Buffer, mimeType: string, ext: string): Promise<StoredDoc> {
  await mkdir(STORAGE_ROOT, { recursive: true });
  const storageKey = `dealer-docs/${randomUUID()}.${ext}`;
  await writeFile(filePath(storageKey), buffer);
  return { storageKey, mimeType, sizeBytes: buffer.byteLength };
}

export async function readDoc(storageKey: string): Promise<{ buffer: Buffer; mimeType: string; sizeBytes: number } | null> {
  const fp = filePath(storageKey);
  try {
    const [buffer, info] = await Promise.all([readFile(fp), stat(fp)]);
    return { buffer, mimeType: mimeFromKey(storageKey), sizeBytes: info.size };
  } catch {
    return null;
  }
}

export async function removeDoc(storageKey: string): Promise<void> {
  try {
    await unlink(filePath(storageKey));
  } catch {
    // ignore missing files
  }
}

export async function removeOrphaned(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => removeDoc(k)));
}

function mimeFromKey(storageKey: string): string {
  const ext = storageKey.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function sign(payload: string): string {
  return createHmac("sha256", SIGN_SECRET).update(payload).digest("base64url");
}

/** Server-side, short-lived view URL for an admin-gated document. */
export function docViewUrl(documentId: string): { url: string; expiresAt: string } {
  const exp = Date.now() + DOC_VIEW_TTL_MS;
  const sig = sign(`${documentId}:${exp}`);
  return {
    url: `/api/admin/dealer-docs/${documentId}?exp=${exp}&sig=${encodeURIComponent(sig)}`,
    expiresAt: new Date(exp).toISOString(),
  };
}

export function verifyDocViewToken(documentId: string, exp: string, sig: string): boolean {
  const t = Number(exp);
  if (!Number.isFinite(t)) return false;
  if (t < Date.now()) return false;
  if (t - Date.now() > DOC_VIEW_TTL_MS) return false;
  const expected = sign(`${documentId}:${t}`);
  const a = Buffer.from(decodeURIComponent(sig));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function contentHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}