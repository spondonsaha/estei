import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCartView } from "@/lib/queries";
import { updateCartItemSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

function sessionIdFrom(req: NextRequest): string | null {
  return req.headers.get("x-session-id") ?? req.nextUrl.searchParams.get("sessionId");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quantity" },
        { status: 400 }
      );
    }

    const session = await auth();
    const sessionId = sessionIdFrom(request);
    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ ok: false, error: "Cart item not found" }, { status: 404 });
    }

    // ownership check
    const owned = session?.user?.id
      ? item.userId === session.user.id
      : item.sessionId === sessionId && !item.userId;
    if (!owned) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (variant && variant.stock < parsed.data.quantity) {
      return NextResponse.json({ ok: false, error: "Not enough stock available" }, { status: 409 });
    }

    await prisma.cartItem.update({ where: { id }, data: { quantity: parsed.data.quantity } });

    const key = session?.user?.id
      ? { userId: session.user.id, sessionId: null }
      : { userId: null, sessionId };
    const view = await getCartView(key);
    return NextResponse.json({ ok: true, data: view });
  } catch (err) {
    console.error("PATCH /api/cart/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const sessionId = sessionIdFrom(request);
    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ ok: false, error: "Cart item not found" }, { status: 404 });
    }
    const owned = session?.user?.id
      ? item.userId === session.user.id
      : item.sessionId === sessionId && !item.userId;
    if (!owned) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    await prisma.cartItem.delete({ where: { id } });

    const key = session?.user?.id
      ? { userId: session.user.id, sessionId: null }
      : { userId: null, sessionId };
    const view = await getCartView(key);
    return NextResponse.json({ ok: true, data: view });
  } catch (err) {
    console.error("DELETE /api/cart/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to update cart" }, { status: 500 });
  }
}