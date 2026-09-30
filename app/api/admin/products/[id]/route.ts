import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminProductUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true, variants: true },
    });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: product });
  } catch (err) {
    console.error("GET /api/admin/products/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to load product" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = adminProductUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const { variants, ...fields } = data;

    // Only touch the fields that were actually sent, so unrelated values
    // (description, material, flags) are never overwritten with defaults.
    const update: Record<string, unknown> = { ...fields };
    if (fields.compareAtPrice !== undefined) {
      update.compareAtPrice = fields.compareAtPrice === "" ? null : Number(fields.compareAtPrice);
    }

    if (variants?.length) {
      const seen = new Set<string>();
      for (const v of variants) {
        const key = `${v.size}::${v.colourName}`;
        if (seen.has(key)) {
          return NextResponse.json(
            { ok: false, error: `Duplicate variant for size ${v.size} / ${v.colourName}` },
            { status: 400 }
          );
        }
        seen.add(key);
      }
      const existing = await prisma.productVariant.findMany({
        where: { productId: id },
        select: { size: true, colourName: true },
      });
      const existingKeys = new Set(existing.map((v) => `${v.size}::${v.colourName}`));
      const clash = variants.find((v) => existingKeys.has(`${v.size}::${v.colourName}`));
      if (clash) {
        return NextResponse.json(
          { ok: false, error: `Size ${clash.size} / ${clash.colourName} already exists` },
          { status: 400 }
        );
      }
      // Variant SKUs must be unique, so derive them from the product's stored SKU
      // rather than trusting whatever the client sent.
      const parent = await prisma.product.findUnique({
        where: { id },
        select: { sku: true },
      });
      if (!parent) {
        return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
      }
      update.variants = {
        create: variants.map((v) => ({
          size: v.size,
          colourName: v.colourName,
          colourHex: v.colourHex,
          stock: v.stock,
          sku: `${parent.sku}-${v.size}-${v.colourName.replace(/[^A-Za-z0-9]+/g, "")}`,
        })),
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: update,
      select: { id: true, slug: true, name: true },
    });

    return NextResponse.json({ ok: true, data: product });
  } catch (err) {
    console.error("PATCH /api/admin/products/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApi())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, sku: true },
    });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    // CartItem.productId and OrderItem.productId are plain RESTRICT foreign keys,
    // so a product that sits in somebody's cart or appears on an order cannot be
    // removed. Report exactly what is in the way instead of failing with a
    // generic 500 that gives the admin no idea what to do.
    const [orderLines, cartCount] = await Promise.all([
      prisma.orderItem.findMany({
        where: { productId: id },
        select: { order: { select: { orderNumber: true } } },
        orderBy: { order: { createdAt: "asc" } },
      }),
      prisma.cartItem.count({ where: { productId: id } }),
    ]);

    if (orderLines.length > 0 || cartCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "PRODUCT_IN_USE",
          error: `"${product.name}" cannot be deleted`,
          orderCount: orderLines.length,
          orderNumbers: [...new Set(orderLines.map((l) => l.order.orderNumber))],
          cartCount,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    console.error("DELETE /api/admin/products/[id]", err);
    // Someone can add the product to a cart between the check above and the
    // delete, which trips the same RESTRICT constraint. Report it the same way
    // rather than as a server error.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        {
          ok: false,
          code: "PRODUCT_IN_USE",
          error: "This product is now in use and cannot be deleted",
          orderCount: 0,
          orderNumbers: [],
          cartCount: 0,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: "Failed to delete product" }, { status: 500 });
  }
}