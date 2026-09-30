import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueOtp, OTP_EXPIRY_MINUTES } from "@/lib/otp";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mailer";
import { otpEmailHtml, otpEmailText } from "@/lib/mail-templates";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const sendLimiter = createRateLimiter(3, 15 * 60 * 1000);

const emailSchema = z.object({ email: z.string().email("Enter a valid email address").max(190) });

export async function POST(request: NextRequest) {
  try {
    const parsed = emailSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    if (!sendLimiter.allow(`${clientIp(request)}:${email}`)) {
      return NextResponse.json({ ok: false, error: "Too many requests. Please wait and try again." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, isVerified: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "No account found for this email" }, { status: 404 });
    }
    if (user.isVerified) {
      return NextResponse.json({ ok: false, error: "This email is already verified" }, { status: 400 });
    }

    const code = await issueOtp(email);
    const result = await sendMail({
      to: email,
      subject: `Your ESTEI verification code is ${code}`,
      html: otpEmailHtml({ siteUrl: SITE_URL, name: user.name, code, expiresInMinutes: OTP_EXPIRY_MINUTES }),
      text: otpEmailText({ name: user.name, code, expiresInMinutes: OTP_EXPIRY_MINUTES }),
    });
    if (!result.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[otp] mail not delivered (SMTP not configured). Verification code for ${email}: ${code}`);
        return NextResponse.json({ ok: true, data: { devCode: code } });
      }
      return NextResponse.json(
        { ok: false, error: "Could not send the verification email right now. Please try again later." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/otp/send", err);
    return NextResponse.json(
      { ok: false, error: "Could not send the verification email right now. Please try again later." },
      { status: 500 }
    );
  }
}
