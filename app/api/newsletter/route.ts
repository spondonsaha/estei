import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const subscribeLimiter = createRateLimiter(10, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    if (!subscribeLimiter.allow(`${clientIp(request)}:${email}`)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait and try again." },
        { status: 429 }
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: true, data: { subscribed: true, duplicate: true } });
    }

    await prisma.newsletterSubscriber.create({ data: { email } });
    return NextResponse.json({ ok: true, data: { subscribed: true, duplicate: false } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/newsletter", err);
    return NextResponse.json({ ok: false, error: "Failed to subscribe" }, { status: 500 });
  }
}