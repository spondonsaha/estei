import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { ERR, validationMessage } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

const contactLimiter = createRateLimiter(5, 15 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: validationMessage(parsed.error.issues, ERR.CONTACT_SEND_FAILED) },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    if (!contactLimiter.allow(`${clientIp(request)}:${email}`)) {
      return NextResponse.json(
        {
          ok: false,
          error: "You have sent several messages already. Please wait a few minutes before sending another.",
        },
        { status: 429 }
      );
    }

    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ ok: true, data: { received: true } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/contact", err);
    return NextResponse.json({ ok: false, error: ERR.CONTACT_SEND_FAILED }, { status: 500 });
  }
}