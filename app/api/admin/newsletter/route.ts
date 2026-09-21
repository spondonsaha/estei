import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (request.nextUrl.searchParams.get("format") === "csv") {
      const csv = "email,subscribed_at\n" + subscribers
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
      data: subscribers.map((s) => ({ email: s.email, subscribedAt: s.createdAt.toISOString() })),
    });
  } catch (err) {
    console.error("GET /api/admin/newsletter", err);
    return NextResponse.json({ ok: false, error: "Failed to load subscribers" }, { status: 500 });
  }
}