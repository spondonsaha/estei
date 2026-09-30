import { NextRequest, NextResponse } from "next/server";
import { normalizeImage } from "@/lib/dealer-image";
import { saveDoc } from "@/lib/storage";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

const uploadLimiter = createRateLimiter(12, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  // Rate limiting alone left this route open to any visitor, who could write
  // arbitrary files into production storage. Auth first.
  if (!(await requireAdminApi())) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ip = clientIp(request);
  if (!uploadLimiter.allow(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ ok: false, error: "Empty file" }, { status: 400 });
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const normalized = await normalizeImage(raw);

    const stored = await saveDoc(normalized.buffer, normalized.mimeType, "webp");

    return NextResponse.json({
      ok: true,
      storageKey: stored.storageKey,
      fileName: file.name,
      sizeBytes: stored.sizeBytes,
      width: normalized.width,
      height: normalized.height,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = /exceeds|only|corrupted|allowed|empty|unsupported|animated/i.test(message)
      ? 400
      : 500;
    console.error("POST /api/dealer/upload", err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}