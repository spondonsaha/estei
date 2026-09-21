import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid registration" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: parsed.data.email.toLowerCase() },
          ...(parsed.data.phone ? [{ phone: parsed.data.phone }] : []),
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An account with this email or phone already exists" },
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

    return NextResponse.json({ ok: true, data: { id: user.id } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/register", err);
    return NextResponse.json({ ok: false, error: "Failed to create account" }, { status: 500 });
  }
}