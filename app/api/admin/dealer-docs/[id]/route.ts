import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/admin";
import { readDoc, verifyDocViewToken } from "@/lib/storage";
import { clientIp } from "@/lib/rate-limit";
import { ERR } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

/**
 * Serves a private dealer document.
 *
 * Access requires BOTH a valid short-lived HMAC token (60s expiry) AND an
 * authenticated ADMIN session. Every successful view is written to AuditLog.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminApiSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_REQUIRED }, { status: 401 });
    }

    const { id } = await params;
    const exp = request.nextUrl.searchParams.get("exp") ?? "";
    const sig = request.nextUrl.searchParams.get("sig") ?? "";

    if (!verifyDocViewToken(id, exp, sig)) {
      return NextResponse.json(
        { ok: false, error: "This document link has expired. Reopen the application to refresh it." },
        { status: 410 }
      );
    }

    const document = await prisma.dealerDocument.findUnique({
      where: { id },
      select: {
        id: true,
        applicationId: true,
        storageKey: true,
        fileName: true,
        mimeType: true,
      },
    });
    if (!document) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_NOT_FOUND }, { status: 404 });
    }

    const file = await readDoc(document.storageKey);
    if (!file) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_FILE_MISSING }, { status: 404 });
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email ?? "admin",
        action: "DOCUMENT_VIEW",
        documentId: document.id,
        applicationId: document.applicationId,
        storageKey: document.storageKey,
        ipAddress: clientIp(request),
      },
    });

    const payload = new Uint8Array(file.buffer).buffer;

    return new NextResponse(payload, {
      headers: {
        "Content-Type": document.mimeType || file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Cache-Control": "no-store, private, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename="${document.fileName}"`,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/dealer-docs/[id]", err);
    return NextResponse.json({ ok: false, error: ERR.ADMIN_LOAD_FAILED }, { status: 500 });
  }
}