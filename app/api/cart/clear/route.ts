import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { attachCartSessionCookie, resolveCartSessionId } from "@/lib/cart-session";
import { ERR } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const { sessionId, setCookie } = resolveCartSessionId(request);

    if (session?.user?.id) {
      await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    } else {
      await prisma.cartItem.deleteMany({ where: { sessionId, userId: null } });
    }

    const res = NextResponse.json({ ok: true, data: { count: 0 } });
    return setCookie ? attachCartSessionCookie(res, sessionId) : res;
  } catch (err) {
    console.error("DELETE /api/cart/clear", err);
    return NextResponse.json({ ok: false, error: ERR.CART_CLEAR_FAILED }, { status: 500 });
  }
}