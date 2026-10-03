import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { ERR } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

const LIMIT = 20;

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_REQUIRED }, { status: 401 });
    }

    const rawPage = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim();

    const where: Prisma.NewsletterSubscriberWhereInput = q
      ? { email: { contains: q, mode: "insensitive" } }
      : {};

    const [total, rows] = await prisma.$transaction([
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * LIMIT,
        take: LIMIT,
      }),
    ]);

    if (request.nextUrl.searchParams.get("export") === "csv") {
      const csv = "email,subscribed_at\n" + rows
        .map((s) => `"${s.email}","${s.createdAt.toISOString()}"`)
        .join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=newsletter-subscribers.csv",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        total,
        page,
        pageCount: Math.ceil(total / LIMIT),
        rows: rows.map((s) => ({
          id: s.id,
          email: s.email,
          createdAt: s.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/newsletter", err);
    return NextResponse.json({ ok: false, error: ERR.ADMIN_LOAD_FAILED }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_REQUIRED }, { status: 401 });
    }
    const body = (await request.json().catch(() => null)) as { id?: string } | null;
    if (!body?.id) {
      return NextResponse.json({ ok: false, error: ERR.ADMIN_SUBSCRIBER_ID_REQUIRED }, { status: 400 });
    }
    await prisma.newsletterSubscriber.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/newsletter", err);
    return NextResponse.json({ ok: false, error: ERR.ADMIN_DELETE_FAILED }, { status: 500 });
  }
}