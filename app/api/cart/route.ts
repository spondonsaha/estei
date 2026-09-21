import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCartView } from "@/lib/queries";
import { addToCartSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

function sessionIdFrom(req: NextRequest): string | null {
  return req.headers.get("x-session-id") ?? req.nextUrl.searchParams.get("sessionId");
}

async function resolveKey(req: NextRequest) {
  const session = await auth();
  const sessionId = sessionIdFrom(req);
  if (session?.user?.id) {
    // adopt any guest cart into the user's cart
    if (sessionId) {
      const guestItems = await prisma.cartItem.findMany({ where: { sessionId } });
      for (const item of guestItems) {
        const existing = await prisma.cartItem.findFirst({
          where: { userId: session.user.id, productId: item.productId, variantId: item.variantId },
        });
        if (existing) {
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
          await prisma.cartItem.delete({ where: { id: item.id } });
        } else {
          await prisma.cartItem.update({
            where: { id: item.id },
            data: { userId: session.user.id, sessionId: null },
          });
        }
      }
    }
    return { userId: session.user.id, sessionId: null as string | null };
  }
  return { userId: null, sessionId };
}

export async function GET(request: NextRequest) {
  try {
    const key = await resolveKey(request);
    const view = await getCartView(key);
    return NextResponse.json({ ok: true, data: view });
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
    if (variant.stock < quantity) {
      return NextResponse.json({ ok: false, error: "Not enough stock available" }, { status: 409 });
    }

    const where = key.userId
      ? { userId: key.userId, productId, variantId }
      : { sessionId: key.sessionId, productId, variantId };

    const existing = await prisma.cartItem.findFirst({
      where: {
        ...(key.userId ? { userId: key.userId } : { sessionId: key.sessionId }),
        productId,
        variantId,
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { ...where, quantity },
      });
    }

    const view = await getCartView(key);
    return NextResponse.json({ ok: true, data: view }, { status: 201 });
  } catch (err) {
    console.error("POST /api/cart", err);
    return NextResponse.json({ ok: false, error: "Failed to update cart" }, { status: 500 });
  }
}