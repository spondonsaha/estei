import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductEditForm } from "@/components/admin/product-edit-form";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { size: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-estei-gray-400 hover:text-estei-red"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-estei-gray-900">Edit product</h1>
      <ProductEditForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          description: product.description,
          material: product.material,
          price: product.price.toString(),
          compareAtPrice: product.compareAtPrice?.toString() ?? null,
          categoryId: product.categoryId,
          gender: product.gender,
          isNewArrival: product.isNewArrival,
          isBestSeller: product.isBestSeller,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
        }}
        categories={categories}
        variants={product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          colourName: v.colourName,
          colourHex: v.colourHex,
          stock: v.stock,
          sku: v.sku,
        }))}
      />
    </div>
  );
}
