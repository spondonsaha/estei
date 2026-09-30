import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const verifyLimiter = createRateLimiter(10, 15 * 60 * 1000);

const VERIFY_ERRORS: Record<string, string> = {
  NOT_FOUND: "No verification code found. Please request a new one.",
  EXPIRED: "This code has expired. Please request a new one.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Please request a new code.",
  INVALID_CODE: "Incorrect code. Please try again.",
};

const verifySchema = z.object({
  email: z.string().email("Enter a valid email address").max(190),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = verifySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    if (!verifyLimiter.allow(`${clientIp(request)}:${email}`)) {
      return NextResponse.json({ ok: false, error: "Too many attempts. Please wait and try again." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isVerified: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "No account found for this email" }, { status: 404 });
    }
    if (user.isVerified) {
      return NextResponse.json({ ok: true, data: { verified: true } });
    }

    const result = await verifyOtp(email, parsed.data.code);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: VERIFY_ERRORS[result.reason] }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
    return NextResponse.json({ ok: true, data: { verified: true } });
  } catch (err) {
    console.error("POST /api/auth/otp/verify", err);
    return NextResponse.json(
      { ok: false, error: "Could not verify the code right now. Please try again later." },
      { status: 500 }
    );
  }
}
