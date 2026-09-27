import { NextRequest, NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";
import { sendOrderConfirmation } from "@/lib/order-mail";

export const dynamic = "force-dynamic";

const ORDER_NUMBER_LOCK_KEY = 53377401;

function padOrderNumber(n: number): string {
  return `ESTEI-${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
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

    let userEmail: string | null = null;
    if (userId) {
      const account = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVerified: true, email: true },
      });
      if (!account) {
        return NextResponse.json({ ok: false, error: "Account not found. Please log in again." }, { status: 401 });
      }
      if (!account.isVerified) {
        return NextResponse.json(
          { ok: false, error: "Please verify your email before placing an order. Go to My Account to resend the verification code." },
          { status: 403 }
        );
      }
      userEmail = account.email;
    }

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
    const subtotal = items.reduce((acc, item) => {
      const variant = variants.find((v) => v.id === item.variantId);
      return acc.add(variant!.product.price.mul(item.quantity));
    }, new Prisma.Decimal(0));

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant || variant.product.id !== item.productId || !variant.product.isActive) {
        return NextResponse.json({ ok: false, error: "Invalid cart item" }, { status: 400 });
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            ok: false,
            error: `${variant.product.name} (Size ${variant.size}, ${variant.colourName}) is out of stock`,
          },
          { status: 409 }
        );
      }
    }

    if (subtotal.lte(0)) {
      return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400 });
    }

    const shippingFee = district.shippingFee;
    const total = subtotal.add(shippingFee);

    let savedAddress: { id: string } | null = null;
    if (userId && parsed.data.saveAddress) {
      savedAddress = await prisma.address.create({
        data: {
          userId,
          fullName: address.fullName,
          phone: address.phone,
          district: address.district,
          city: address.city || address.thana,
          thana: address.thana,
          area: address.area ?? null,
          addressLine: address.addressLine,
          postalCode: address.postalCode ?? null,
          isDefault: false,
        },
        select: { id: true },
      });
    }

    const viewToken = randomUUID();

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

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ORDER_NUMBER_LOCK_KEY})`;
      const orderCount = await tx.order.count();
      const orderNumber = padOrderNumber(orderCount + 1);

      return tx.order.create({
        data: {
          orderNumber,
          viewToken,
          userId,
          addressId: savedAddress?.id ?? null,
          guestName: address.fullName,
          guestPhone: address.phone,
          guestEmail: address.email,
          guestAddress: address.addressLine,
          guestCity: address.city || null,
          guestArea: address.area || null,
          guestThana: address.thana,
          guestPostalCode: address.postalCode || null,
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

    const recipient = userEmail ?? address.email;
    if (recipient) {
      after(() => {
        void sendOrderConfirmation(recipient, {
          orderNumber: order.orderNumber,
          viewToken: order.viewToken ?? undefined,
          customerName: userId ? (session?.user?.name ?? "Customer") : address.fullName,
          phone: order.guestPhone,
          email: order.guestEmail,
          addressLine: order.guestAddress,
          city: order.guestCity,
          area: order.guestArea,
          thana: order.guestThana,
          postalCode: order.guestPostalCode,
          district: order.district,
          notes: order.notes,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          total: order.total,
          items: order.items,
        });
      });
    }

    return NextResponse.json(
      {
        ok: true,
        data: { orderNumber: order.orderNumber, viewToken: order.viewToken, total: order.total.toString() },
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