import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/admin";
import { DEALER_STATUSES } from "@/lib/dealer-ui";
import { ERR } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminApiSession())) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_REQUIRED }, { status: 401 });
    }
    const rawStatus = request.nextUrl.searchParams.get("status") ?? "";
    const status = (DEALER_STATUSES as string[]).includes(rawStatus) ? (rawStatus as never) : undefined;
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
    const limit = 20;

    const where = status ? { status } : {};
    const [total, applications] = await prisma.$transaction([
      prisma.dealerApplication.count({ where }),
      prisma.dealerApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          package: { select: { name: true } },
          _count: { select: { documents: true } },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        total,
        page,
        pageCount: Math.ceil(total / limit),
        applications: applications.map((a) => ({
          id: a.id,
          refNumber: a.refNumber,
          phone: a.phone,
          businessLoc: a.businessLoc,
          packageName: a.package.name,
          monthlyDemand: a.monthlyDemand,
          status: a.status,
          consentAt: a.consentAt ? a.consentAt.toISOString() : null,
          docCount: a._count.documents,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/dealers", err);
    return NextResponse.json({ ok: false, error: ERR.ADMIN_LOAD_FAILED }, { status: 500 });
  }
}