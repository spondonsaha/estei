import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Private document storage backed by Neon/Postgres (BYTEA).
 *
 * File bytes are stored in the `UploadedFile` table and are NEVER exposed
 * through a public URL. The only way to read them is via a short-lived,
 * HMAC-signed, admin-gated route (see app/api/admin/dealer-docs/[id]/route.ts).
 * Callers only ever touch `storageKey`.
 */

const configuredSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !configuredSecret) {
  throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set in production (used to sign dealer document URLs)");
}
const SIGN_SECRET = configuredSecret ?? "dev-estei-change-me";

export const DOC_VIEW_TTL_MS = 60_000;

export type StoredDoc = {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
};

export async function saveDoc(buffer: Buffer, mimeType: string, ext: string): Promise<StoredDoc> {
  const storageKey = `dealer-docs/${randomUUID()}.${ext}`;
  const bytes = new Uint8Array(buffer);
  await prisma.uploadedFile.create({
    data: { storageKey, content: bytes, mimeType, sizeBytes: bytes.byteLength },
  });
  return { storageKey, mimeType, sizeBytes: bytes.byteLength };
}

export async function readDoc(
  storageKey: string
): Promise<{ buffer: Buffer; mimeType: string; sizeBytes: number } | null> {
  const row = await prisma.uploadedFile.findUnique({ where: { storageKey } });
  if (!row) return null;
  return { buffer: Buffer.from(row.content), mimeType: row.mimeType, sizeBytes: row.sizeBytes };
}

export async function removeDoc(storageKey: string): Promise<void> {
  try {
    await prisma.uploadedFile.delete({ where: { storageKey } });
  } catch {
    // ignore missing files
  }
}

export async function removeOrphaned(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await prisma.uploadedFile.deleteMany({ where: { storageKey: { in: keys } } });
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