import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { adminProductUpdateSchema } from "@/lib/validations";
import { destroyProductImage } from "@/lib/cloudinary";
import { uniqueProductSlug } from "@/lib/product-slug";
import { slugify } from "@/lib/slug";

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
    const { variants, images, ...fields } = data;

    // Only touch the fields that were actually sent, so unrelated values
    // (description, material, flags) are never overwritten with defaults.
    const update: Record<string, unknown> = { ...fields };
    if (fields.compareAtPrice !== undefined) {
      update.compareAtPrice = fields.compareAtPrice === "" ? null : Number(fields.compareAtPrice);
    }

    if (fields.slug !== undefined) {
      let fallback = typeof fields.name === "string" ? fields.name : "";
      if (!slugify(fields.slug) && !fallback) {
        const current = await prisma.product.findUnique({
          where: { id },
          select: { name: true },
        });
        fallback = current?.name ?? "";
      }
      update.slug = await uniqueProductSlug(fields.slug, fallback, id);
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

    // Images are sent as the full desired set and applied as a
    // delete-then-recreate swap. With at most 10 rows this is cheaper than
    // diffing three ways, and it keeps sortOrder consistent with the client's
    // ordering. Assets removed by this change are destroyed only after the
    // database transaction has committed.
    let removedStorageKeys: string[] = [];
    if (images) {
      const previous = await prisma.productImage.findMany({
        where: { productId: id },
        select: { storageKey: true },
      });
      // Only Cloudinary-hosted assets can be destroyed; legacy remote URLs
      // (Unsplash) carry no storageKey and are intentionally ignored here.
      const incoming = new Set(
        images.map((i) => i.storageKey).filter((k): k is string => Boolean(k)),
      );
      removedStorageKeys = previous
        .map((p) => p.storageKey)
        .filter((k): k is string => k !== null && !incoming.has(k));

      await prisma.$transaction(async (tx) => {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img, i) => ({
              productId: id,
              url: img.url,
              storageKey: img.storageKey ?? null,
              alt: img.alt,
              colour: img.colour,
              sortOrder: img.sortOrder ?? i,
            })),
          });
        }
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: update,
      select: { id: true, slug: true, name: true },
    });

    // Never destroy inside the transaction: a rollback would leave the database
    // referencing assets that no longer exist.
    for (const key of removedStorageKeys) {
      try {
        await destroyProductImage(key);
      } catch (err) {
        console.error("PATCH /api/admin/products/[id] destroy", key, err);
      }
    }

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

    const images = await prisma.productImage.findMany({
      where: { productId: id },
      select: { storageKey: true },
    });

    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    // Product row is gone; now reclaim the hosted assets.
    for (const img of images) {
      if (!img.storageKey) continue;
      try {
        await destroyProductImage(img.storageKey);
      } catch (err) {
        console.error("DELETE /api/admin/products/[id] destroy", img.storageKey, err);
      }
    }

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