import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";
import { ERR, validationMessage } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

const verifyLimiter = createRateLimiter(10, 15 * 60 * 1000);

const VERIFY_ERRORS: Record<string, string> = {
  NOT_FOUND: "No verification code found. Please request a new one.",
  EXPIRED: "This code has expired. Please request a new one.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Please request a new code.",
  INVALID_CODE: "Incorrect code. Please try again.",
};

export async function POST(request: NextRequest) {
  const parsed = z
    .object({
      email: z.string().email("Enter a valid email address").max(190),
      code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: validationMessage(parsed.error.issues, ERR.OTP_CODE_INVALID) }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  if (!verifyLimiter.allow(`${clientIp(request)}:${email}`)) {
    return NextResponse.json({ ok: false, error: ERR.OTP_VERIFY_RATE_LIMITED }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isVerified: true } });
  if (!user) {
    return NextResponse.json({ ok: false, error: ERR.OTP_ACCOUNT_NOT_FOUND }, { status: 404 });
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
}