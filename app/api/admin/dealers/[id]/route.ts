import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/admin";
import { adminDealerStatusSchema } from "@/lib/validations";
import { docViewUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminApiSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;

    const application = await prisma.dealerApplication.findUnique({
      where: { id },
      include: {
        package: { select: { id: true, name: true, description: true, minPairs: true, maxPairs: true } },
        documents: {
          orderBy: { uploadedAt: "asc" },
          select: {
            id: true,
            type: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
          },
        },
      },
    });
    if (!application) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: application.id,
        refNumber: application.refNumber,
        phone: application.phone,
        businessLoc: application.businessLoc,
        monthlyDemand: application.monthlyDemand,
        status: application.status,
        adminNote: application.adminNote,
        consentAt: application.consentAt ? application.consentAt.toISOString() : null,
        submittedAt: application.createdAt.toISOString(),
        ipAddress: application.ipAddress,
        package: application.package,
        documents: application.documents.map((d) => ({
          id: d.id,
          type: d.type,
          fileName: d.fileName,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          uploadedAt: d.uploadedAt.toISOString(),
          view: docViewUrl(d.id),
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/dealers/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to load application" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminApiSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = adminDealerStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }

    const application = await prisma.dealerApplication.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote || null,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
      select: { id: true, refNumber: true, status: true, adminNote: true },
    });

    return NextResponse.json({ ok: true, data: application });
  } catch (err) {
    console.error("PATCH /api/admin/dealers/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to update application" }, { status: 500 });
  }
}