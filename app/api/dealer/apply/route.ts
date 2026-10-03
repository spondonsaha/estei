import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dealerApplicationSchema } from "@/lib/validations";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { readDoc, removeOrphaned } from "@/lib/storage";
import { notifyAdminNewApplication, notifyApplicantConfirmation } from "@/lib/notify";
import { ERR, validationMessage } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

const applyLimiter = createRateLimiter(3, 60 * 60 * 1000);

const OPEN_STATUSES = ["PENDING", "DOCS_REVIEW", "VERIFIED"] as const;

/** Normalize "+8801XXXXXXXXX" / "8801..." → "01XXXXXXXXX". */
function normalizePhone(input: string): string {
  let p = input.replace(/[\s-]/g, "");
  if (p.startsWith("+88")) p = p.slice(3);
  else if (p.startsWith("88")) p = p.slice(2);
  return p;
}

function nextRef(candidates: string[], year: number): string {
  let maxSeq = 0;
  const prefix = `DLR-${year}-`;
  for (const ref of candidates) {
    if (!ref.startsWith(prefix)) continue;
    const seq = Number(ref.slice(prefix.length));
    if (Number.isInteger(seq) && seq > maxSeq) maxSeq = seq;
  }
  return `DLR-${year}-${String(maxSeq + 1).padStart(6, "0")}`;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!applyLimiter.allow(ip)) {
    return NextResponse.json(
      { ok: false, error: ERR.DEALER_APPLY_RATE_LIMITED },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = dealerApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: validationMessage(parsed.error.issues, ERR.DEALER_APPLY_FAILED) },
        { status: 400 }
      );
    }

    const phone = normalizePhone(parsed.data.phone);

    const existing = await prisma.dealerApplication.findFirst({
      where: { phone, status: { in: [...OPEN_STATUSES] } },
      orderBy: { createdAt: "desc" },
      select: { refNumber: true, status: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: ERR.DEALER_APPLY_DUPLICATE,
          refNumber: existing.refNumber,
        },
        { status: 409 }
      );
    }

    const packageRow = await prisma.sellPackage.findUnique({
      where: { id: parsed.data.packageId },
      select: { id: true },
    });
    if (!packageRow) {
      return NextResponse.json({ ok: false, error: ERR.DEALER_PACKAGE_INVALID }, { status: 400 });
    }

    const allKeys = [...parsed.data.nidKeys, ...parsed.data.locationKeys];
    const stored = await Promise.all(
      allKeys.map(async (storageKey) => ({ storageKey, meta: await readDoc(storageKey) }))
    );
    if (stored.some((s) => !s.meta)) {
      return NextResponse.json({ ok: false, error: ERR.DEALER_UPLOADS_EXPIRED }, { status: 400 });
    }
    const sizeByKey = new Map(stored.map((s) => [s.storageKey, s.meta!.sizeBytes]));

    const docTypes: Record<string, { key: string; type: string; label: string }> = {};
    parsed.data.nidKeys.forEach((storageKey, i) => {
      docTypes[storageKey] = {
        key: storageKey,
        type: (["NID_FRONT", "NID_BACK", "FACE_PHOTO"] as const)[i] ?? "NID_FRONT",
        label: (["NID", "NID Back", "Face"] as const)[i] ?? "NID",
      };
    });
    parsed.data.locationKeys.forEach((storageKey, i) => {
      docTypes[storageKey] = { key: storageKey, type: "LOCATION_DOC", label: i > 0 ? "Location 2" : "Location 1" };
    });

    const year = new Date().getFullYear();

    try {
      const application = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(53377402)`;
        const existingRefs = await tx.dealerApplication.findMany({
          where: { refNumber: { startsWith: `DLR-${year}-` } },
          select: { refNumber: true },
        });
        const refNumber = nextRef(existingRefs.map((r) => r.refNumber), year);

        const created = await tx.dealerApplication.create({
          data: {
            refNumber,
            phone,
            businessLoc: parsed.data.businessLoc.trim(),
            packageId: parsed.data.packageId,
            monthlyDemand: parsed.data.monthlyDemand,
            status: "PENDING",
            consentAt: parsed.data.consent ? new Date() : null,
            ipAddress: ip === "unknown" ? null : ip,
            userAgent: request.headers.get("user-agent"),
            documents: {
              create: Object.values(docTypes).map(({ key, type, label }) => ({
                type: type as never,
                storageKey: key,
                fileName: `${label}.webp`,
                mimeType: "image/webp",
                sizeBytes: sizeByKey.get(key) ?? 0,
              })),
            },
          },
        });

        return { refNumber: created.refNumber };
      });

      void notifyAdminNewApplication({
        refNumber: application.refNumber,
        phone,
        businessLoc: parsed.data.businessLoc,
      });
      void notifyApplicantConfirmation({ refNumber: application.refNumber, phone, businessLoc: parsed.data.businessLoc });

      return NextResponse.json({ ok: true, refNumber: application.refNumber }, { status: 201 });
    } catch (err) {
      // Application creation failed — remove the uploaded objects so they don't linger.
      void removeOrphaned(allKeys);
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          { ok: false, error: ERR.DEALER_APPLY_FAILED },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    console.error("POST /api/dealer/apply", err);
    return NextResponse.json({ ok: false, error: ERR.DEALER_APPLY_FAILED }, { status: 500 });
  }
}