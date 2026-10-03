import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const districts = await prisma.district.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({
      ok: true,
      data: districts.map((d) => ({ name: d.name, division: d.division, shippingFee: d.shippingFee.toString() })),
    });
  } catch (err) {
    console.error("GET /api/districts", err);
    return NextResponse.json({ ok: false, error: "We could not load the district list. Please refresh the page and try again." }, { status: 500 });
  }
}