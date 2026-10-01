import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { destroyProductImage } from "@/lib/cloudinary";
import { z } from "zod";

export const dynamic = "force-dynamic";

const cleanupSchema = z.object({
  storageKeys: z.array(z.string().min(1).max(200)).max(20),
});

/**
 * Destroys Cloudinary assets that were uploaded but never attached to a
 * product (product creation failed, or the admin cancelled the dialog).
 * Without this, every abandoned upload leaks storage and transformation credits
 * until the account hits its ceiling.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = cleanupSchema.parse(await request.json());
    let removed = 0;

    for (const key of body.storageKeys) {
      try {
        await destroyProductImage(key);
        removed++;
      } catch (err) {
        // A single failure must not block the rest of the cleanup.
        console.error("POST /api/admin/products/upload/cleanup", key, err);
      }
    }

    return NextResponse.json({ ok: true, removed });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid cleanup request" },
      { status: 400 },
    );
  }
}