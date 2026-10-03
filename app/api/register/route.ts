import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { ERR, validationMessage } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

const registerLimiter = createRateLimiter(10, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: validationMessage(parsed.error.issues, ERR.REGISTER_FAILED) },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    if (!registerLimiter.allow(`${clientIp(request)}:${email}`)) {
      return NextResponse.json(
        { ok: false, error: ERR.REGISTER_RATE_LIMITED },
        { status: 429 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(parsed.data.phone ? [{ phone: parsed.data.phone }] : []),
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: ERR.ACCOUNT_EXISTS },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone || null,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true, data: { id: user.id, requiresOtp: true } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/register", err);
    return NextResponse.json({ ok: false, error: ERR.REGISTER_FAILED }, { status: 500 });
  }
}