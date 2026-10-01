import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { normalizeImage, MAX_UPLOAD_BYTES } from "@/lib/dealer-image";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { uploadProductImage } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// Generous for an admin, still bounds abuse from a compromised session.
const uploadLimiter = createRateLimiter(60, 60 * 60 * 1000);

const MAX_FILES = 10;
const CLIENT_ERROR =
  /exceeds|only|corrupted|allowed|empty|unsupported|animated|too large|maximum/i;

export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ip = clientIp(request);
  if (!uploadLimiter.allow(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    const sku = String(form.get("sku") ?? "product");

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No files provided" },
        { status: 400 },
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { ok: false, error: `Maximum ${MAX_FILES} files at once` },
        { status: 400 },
      );
    }

    // normalizeImage caps each file at MAX_UPLOAD_BYTES; bound the request
    // total too so a batch cannot exhaust server memory.
    const declaredTotal = files.reduce((n, f) => n + f.size, 0);
    if (declaredTotal > MAX_UPLOAD_BYTES * 2) {
      return NextResponse.json(
        { ok: false, error: "Combined upload is too large" },
        { status: 400 },
      );
    }

    const data = [];
    for (const file of files) {
      if (file.size === 0) {
        return NextResponse.json(
          { ok: false, error: `${file.name} is empty` },
          { status: 400 },
        );
      }
      const raw = Buffer.from(await file.arrayBuffer());
      // Magic-byte sniffing, EXIF strip, auto-orient, WebP q82.
      const normalized = await normalizeImage(raw);
      data.push(await uploadProductImage(normalized.buffer, sku));
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = CLIENT_ERROR.test(message) ? 400 : 500;
    console.error("POST /api/admin/products/upload", err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}