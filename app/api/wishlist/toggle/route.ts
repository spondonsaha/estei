import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { wishlistToggleSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = wishlistToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid product" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: parsed.data.productId,
        },
      },
    });

    let added: boolean;
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      added = false;
    } else {
      await prisma.wishlistItem.create({
        data: { userId: session.user.id, productId: parsed.data.productId },
      });
      added = true;
    }

    return NextResponse.json({ ok: true, data: { added } });
  } catch (err) {
    console.error("POST /api/wishlist/toggle", err);
    return NextResponse.json({ ok: false, error: "Failed to update wishlist" }, { status: 500 });
  }
}