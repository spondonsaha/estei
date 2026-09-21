import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dealerSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;
const attempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const list = (attempts.get(ip) ?? []).filter((t) => t > windowStart);
  if (list.length >= RATE_LIMIT_MAX) return true;
  list.push(now);
  attempts.set(ip, list);
  return false;
}

async function nextRefNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.dealerApplication.count();
  return `DLR-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many applications. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = dealerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid application" },
        { status: 400 }
      );
    }

    const existing = await prisma.dealerApplication.findFirst({
      where: { mobile: parsed.data.mobile },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: "An application with this mobile number already exists.",
          data: { refNumber: existing.refNumber },
        },
        { status: 409 }
      );
    }

    const refNumber = await nextRefNumber();
    const app = await prisma.dealerApplication.create({
      data: {
        refNumber,
        fullName: parsed.data.fullName,
        mobile: parsed.data.mobile,
        email: parsed.data.email || null,
        businessName: parsed.data.businessName,
        district: parsed.data.district,
        businessType: parsed.data.businessType,
        address: parsed.data.address || null,
        yearsInBiz: parsed.data.yearsInBiz ? Number(parsed.data.yearsInBiz) : null,
        message: parsed.data.message || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, data: { refNumber: app.refNumber } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/dealer/apply", err);
    return NextResponse.json({ ok: false, error: "Failed to submit application" }, { status: 500 });
  }
}