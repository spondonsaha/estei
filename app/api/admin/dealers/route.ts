import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const status = request.nextUrl.searchParams.get("status");
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
    const limit = 20;

    const where = status ? { status: status as never } : {};
    const [total, applications] = await prisma.$transaction([
      prisma.dealerApplication.count({ where }),
      prisma.dealerApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
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
          fullName: a.fullName,
          mobile: a.mobile,
          email: a.email,
          businessName: a.businessName,
          district: a.district,
          businessType: a.businessType,
          status: a.status,
          yearsInBiz: a.yearsInBiz,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/dealers", err);
    return NextResponse.json({ ok: false, error: "Failed to load applications" }, { status: 500 });
  }
}