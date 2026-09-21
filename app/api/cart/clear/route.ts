import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const sessionId = request.headers.get("x-session-id") ?? null;

    if (session?.user?.id) {
      await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    } else if (sessionId) {
      await prisma.cartItem.deleteMany({ where: { sessionId, userId: null } });
    }

    return NextResponse.json({ ok: true, data: { count: 0 } });
  } catch (err) {
    console.error("DELETE /api/cart/clear", err);
    return NextResponse.json({ ok: false, error: "Failed to clear cart" }, { status: 500 });
  }
}