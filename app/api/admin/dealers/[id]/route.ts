import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminDealerStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
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
      },
    });

    return NextResponse.json({
      ok: true,
      data: { id: application.id, status: application.status },
    });
  } catch (err) {
    console.error("PATCH /api/admin/dealers/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to update application" }, { status: 500 });
  }
}