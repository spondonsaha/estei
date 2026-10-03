import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCartView } from "@/lib/queries";
import { updateCartItemSchema } from "@/lib/validations";
import { attachCartSessionCookie, resolveCartSessionId } from "@/lib/cart-session";
import { ERR, validationMessage } from "@/lib/error-messages";

export const dynamic = "force-dynamic";

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
        { ok: false, error: validationMessage(parsed.error.issues, ERR.CART_UPDATE_FAILED) },
        { status: 400 }
      );
    }

    const session = await auth();
    const { sessionId, setCookie } = resolveCartSessionId(request);
    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ ok: false, error: ERR.CART_ITEM_NOT_FOUND }, { status: 404 });
    }

    // ownership check
    const owned = session?.user?.id
      ? item.userId === session.user.id
      : item.sessionId === sessionId && !item.userId;
    if (!owned) {
      return NextResponse.json({ ok: false, error: ERR.UNAUTHORIZED }, { status: 401 });
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (variant && variant.stock <= 0) {
      return NextResponse.json({ ok: false, error: ERR.OUT_OF_STOCK_ITEM }, { status: 409 });
    }
    if (variant && variant.stock < parsed.data.quantity) {
      return NextResponse.json(
        { ok: false, error: `Only ${variant.stock} left in stock` },
        { status: 409 }
      );
    }

    await prisma.cartItem.update({ where: { id }, data: { quantity: parsed.data.quantity } });

    const key = session?.user?.id
      ? { userId: session.user.id, sessionId: null }
      : { userId: null, sessionId };
    const view = await getCartView(key);
    const res = NextResponse.json({ ok: true, data: view });
    return setCookie ? attachCartSessionCookie(res, sessionId) : res;
  } catch (err) {
    console.error("PATCH /api/cart/[id]", err);
    return NextResponse.json({ ok: false, error: ERR.CART_UPDATE_FAILED }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const { sessionId, setCookie } = resolveCartSessionId(request);
    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ ok: false, error: ERR.CART_ITEM_NOT_FOUND }, { status: 404 });
    }
    const owned = session?.user?.id
      ? item.userId === session.user.id
      : item.sessionId === sessionId && !item.userId;
    if (!owned) {
      return NextResponse.json({ ok: false, error: ERR.UNAUTHORIZED }, { status: 401 });
    }

    await prisma.cartItem.delete({ where: { id } });

    const key = session?.user?.id
      ? { userId: session.user.id, sessionId: null }
      : { userId: null, sessionId };
    const view = await getCartView(key);
    const res = NextResponse.json({ ok: true, data: view });
    return setCookie ? attachCartSessionCookie(res, sessionId) : res;
  } catch (err) {
    console.error("DELETE /api/cart/[id]", err);
    return NextResponse.json({ ok: false, error: ERR.CART_UPDATE_FAILED }, { status: 500 });
  }
}