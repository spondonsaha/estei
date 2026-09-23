import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCartView } from "@/lib/queries";
import { addToCartSchema } from "@/lib/validations";
import { attachCartSessionCookie, resolveCartSessionId } from "@/lib/cart-session";

export const dynamic = "force-dynamic";

async function adoptGuestCart(sessionId: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    const guestItems = await tx.cartItem.findMany({ where: { sessionId, userId: null } });
    for (const item of guestItems) {
      const existing = await tx.cartItem.findFirst({
        where: { userId, productId: item.productId, variantId: item.variantId },
      });
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(20, existing.quantity + item.quantity) },
        });
        await tx.cartItem.delete({ where: { id: item.id } });
      } else {
        await tx.cartItem.update({
          where: { id: item.id },
          data: { userId, sessionId: null },
        });
      }
    }
  });
}

async function resolveKey(request: NextRequest) {
  const session = await auth();
  const { sessionId, setCookie } = resolveCartSessionId(request);
  if (session?.user?.id) {
    await adoptGuestCart(sessionId, session.user.id);
    return { userId: session.user.id, sessionId: null as string | null, cookieId: sessionId, setCookie };
  }
  return { userId: null, sessionId, cookieId: sessionId, setCookie };
}

export async function GET(request: NextRequest) {
  try {
    const key = await resolveKey(request);
    const view = await getCartView(key);
    const res = NextResponse.json({ ok: true, data: view });
    return key.setCookie ? attachCartSessionCookie(res, key.cookieId) : res;
  } catch (err) {
    console.error("GET /api/cart", err);
    return NextResponse.json({ ok: false, error: "Failed to load cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid cart item" },
        { status: 400 }
      );
    }

    const { productId, variantId, quantity } = parsed.data;
    const key = await resolveKey(request);

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { id: true, isActive: true } } },
    });
    if (!variant || variant.productId !== productId || !variant.product.isActive) {
      return NextResponse.json({ ok: false, error: "Product not available" }, { status: 404 });
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        ...(key.userId ? { userId: key.userId } : { sessionId: key.sessionId }),
        productId,
        variantId,
      },
    });

    const newQuantity = existing ? Math.min(20, existing.quantity + quantity) : quantity;
    if (variant.stock < newQuantity) {
      return NextResponse.json({ ok: false, error: "Not enough stock available" }, { status: 409 });
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: key.userId
          ? { userId: key.userId, productId, variantId, quantity }
          : { sessionId: key.sessionId, productId, variantId, quantity },
      });
    }

    const view = await getCartView(key);
    const res = NextResponse.json({ ok: true, data: view }, { status: 201 });
    return key.setCookie ? attachCartSessionCookie(res, key.cookieId) : res;
  } catch (err) {
    console.error("POST /api/cart", err);
    return NextResponse.json({ ok: false, error: "Failed to update cart" }, { status: 500 });
  }
}