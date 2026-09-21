import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  return `ESTEI-${year}-${String(count + 1).padStart(6, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order" },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;
    const { items, address } = parsed.data;

    const district = await prisma.district.findUnique({ where: { name: address.district } });
    if (!district) {
      return NextResponse.json({ ok: false, error: "Invalid district" }, { status: 400 });
    }

    const variantIds = items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { id: true, name: true, price: true, isActive: true } } },
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json({ ok: false, error: "Some products are unavailable" }, { status: 409 });
    }

    // recompute subtotal server-side
    let subtotal = 0;
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant || variant.product.id !== item.productId || !variant.product.isActive) {
        return NextResponse.json({ ok: false, error: "Invalid cart item" }, { status: 400 });
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json(
          { ok: false, error: `Insufficient stock for ${variant.product.name}` },
          { status: 409 }
        );
      }
      subtotal += Number(item.quantity) * Number(variant.product.price);
    }

    if (subtotal <= 0) {
      return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400 });
    }

    const shippingFee = Number(district.shippingFee);
    const total = subtotal + shippingFee;

    let savedAddress: { id: string } | null = null;
    if (userId && parsed.data.saveAddress) {
      savedAddress = await prisma.address.create({
        data: {
          userId,
          fullName: address.fullName,
          phone: address.phone,
          district: address.district,
          city: address.city,
          area: address.area ?? null,
          addressLine: address.addressLine,
          postalCode: address.postalCode ?? null,
          isDefault: false,
        },
        select: { id: true },
      });
    }

    const orderNumber = await nextOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      // stock decrement with in-transaction check to prevent overselling
      for (const item of items) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new Error("OUT_OF_STOCK");
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: savedAddress?.id ?? null,
          guestName: userId ? null : address.fullName,
          guestPhone: userId ? null : address.phone,
          guestAddress: userId ? null : `${address.addressLine}, ${address.city}`,
          district: address.district,
          subtotal,
          shippingFee,
          discount: 0,
          total,
          paymentMethod: address.paymentMethod,
          notes: address.notes ?? null,
          items: {
            create: items.map((item) => {
              const variant = variants.find((v) => v.id === item.variantId)!;
              return {
                productId: item.productId,
                productName: variant.product.name,
                size: variant.size,
                colourName: variant.colourName,
                unitPrice: variant.product.price,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });
    });

    return NextResponse.json(
      {
        ok: true,
        data: { orderNumber: order.orderNumber, total: order.total.toString() },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "OUT_OF_STOCK") {
      return NextResponse.json({ ok: false, error: "Some items are out of stock" }, { status: 409 });
    }
    console.error("POST /api/orders", err);
    return NextResponse.json({ ok: false, error: "Failed to place order" }, { status: 500 });
  }
}