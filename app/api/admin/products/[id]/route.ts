import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/admin";
import { adminProductUpdateSchema } from "@/lib/validations";
import { buildVariantSku, findDuplicateVariant, sizeColourKey } from "@/lib/variants";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdminApiSession())) {
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
    if (!(await requireAdminApiSession())) {
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
      const duplicate = findDuplicateVariant(variants);
      if (duplicate) {
        return NextResponse.json(
          { ok: false, error: `Duplicate variant for size ${duplicate.size} / ${duplicate.colourName}` },
          { status: 400 }
        );
      }
      const existing = await prisma.productVariant.findMany({
        where: { productId: id },
        select: { size: true, colourName: true },
      });
      const existingKeys = new Set(existing.map((v) => sizeColourKey(v.size, v.colourName)));
      const clash = variants.find((v) => existingKeys.has(sizeColourKey(v.size, v.colourName)));
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
          sku: buildVariantSku(parent.sku, v.size, v.colourName),
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
    if (!(await requireAdminApiSession())) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;

    // Images, variants, reviews and wishlist items cascade at the database level,
    // but CartItem.productId and OrderItem.productId are plain RESTRICT foreign
    // keys, so they must be cleared explicitly or the product delete aborts with
    // a P2003 foreign-key violation (surfaced as HTTP 500).
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (err) {
    console.error("DELETE /api/admin/products/[id]", err);
    return NextResponse.json({ ok: false, error: "Failed to delete product" }, { status: 500 });
  }
}