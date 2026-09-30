"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockStepper } from "@/components/admin/stock-stepper";
import { COLOUR_SWATCHES, MEN_SIZE_SET, WOMEN_SIZE_SET } from "@/lib/constants";
import { colourSizeKey, parseColourSizeKey } from "@/lib/variants";

const GENDERS = ["MEN", "WOMEN", "UNISEX"] as const;
type Gender = (typeof GENDERS)[number];

const SIZE_SETS: Record<Gender, string[]> = {
  MEN: [...MEN_SIZE_SET],
  WOMEN: [...WOMEN_SIZE_SET],
  UNISEX: [...new Set([...MEN_SIZE_SET, ...WOMEN_SIZE_SET])],
};

type Category = { id: string; name: string };

type Variant = {
  id: string;
  size: string;
  colourName: string;
  colourHex: string;
  stock: number;
  sku: string;
};

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    description: string;
    material: string;
    price: string;
    compareAtPrice: string | null;
    categoryId: string;
    gender: Gender;
    isNewArrival: boolean;
    isBestSeller: boolean;
    isFeatured: boolean;
    isActive: boolean;
  };
  categories: Category[];
  variants: Variant[];
};

export function ProductEditForm({ product, categories, variants }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    material: product.material,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? "",
    categoryId: product.categoryId,
    gender: product.gender,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
  });
  // Keyed by `colourSizeKey(colour, size)` so each colour keeps its own quantities.
  const [newSizes, setNewSizes] = useState<Record<string, string>>({});
  const [newColours, setNewColours] = useState<string[]>([]);

  const existingColours = Array.from(new Set(variants.map((v) => v.colourName)));
  const addableColours = COLOUR_SWATCHES.filter((c) => !existingColours.includes(c.name));

  const availableSizes = (colourName: string) => {
    const taken = new Set(
      variants.filter((v) => v.colourName === colourName).map((v) => v.size)
    );
    return SIZE_SETS[form.gender].filter((s) => !taken.has(s));
  };

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const addedVariants = Object.entries(newSizes)
      .filter(([, qty]) => qty !== "")
      .map(([key, qty]) => {
        const { colourName, size } = parseColourSizeKey(key);
        const swatch = COLOUR_SWATCHES.find((c) => c.name === colourName) ?? COLOUR_SWATCHES[0];
        return { size, colourName, colourHex: swatch.hex, stock: Number(qty) };
      });

    if (Object.values(newSizes).some((q) => q !== "" && (!Number.isFinite(Number(q)) || Number(q) < 0))) {
      toast.error("Stock must be zero or a positive number");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          sku: form.sku,
          description: form.description,
          material: form.material,
          price: Number(form.price),
          compareAtPrice: form.compareAtPrice,
          categoryId: form.categoryId,
          gender: form.gender,
          isNewArrival: form.isNewArrival,
          isBestSeller: form.isBestSeller,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
          ...(addedVariants.length > 0 ? { variants: addedVariants } : {}),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to save product");
        return;
      }
      setNewSizes({});
      setNewColours([]);
      toast.success(
        addedVariants.length > 0
          ? `Product saved — ${addedVariants.length} new variant(s) added`
          : "Product saved"
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-estei-gray-900">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="categoryId">Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
              <SelectTrigger id="categoryId" aria-label="Category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="price">Price (৳)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="compareAtPrice">Compare at price (৳)</Label>
            <Input
              id="compareAtPrice"
              type="number"
              min={0}
              step="0.01"
              value={form.compareAtPrice}
              placeholder="Leave empty for no discount"
              onChange={(e) => set("compareAtPrice", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              value={form.material}
              onChange={(e) => set("material", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="gender">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v as Gender)}>
              <SelectTrigger id="gender" aria-label="Gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {(
            [
              ["isActive", "Active"],
              ["isNewArrival", "New arrival"],
              ["isBestSeller", "Best seller"],
              ["isFeatured", "Featured"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-estei-gray-700">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="h-4 w-4 rounded border-estei-gray-200 accent-estei-red"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-estei-gray-900">Stock</h2>
          <span className="text-sm text-estei-gray-400">
            {totalStock} units across {variants.length} size{variants.length === 1 ? "" : "s"}
          </span>
        </div>

        {variants.length === 0 ? (
          <p className="rounded-md bg-estei-red-tint px-4 py-3 text-sm text-estei-red">
            This product has no variants, so it cannot be added to a cart. Pick a colour below and
            enter stock for at least one size.
          </p>
        ) : (
          <div className="space-y-5">
            {existingColours.map((colourName) => {
              const swatch = COLOUR_SWATCHES.find((c) => c.name === colourName);
              const colourVariants = variants.filter((v) => v.colourName === colourName);
              const colourTotal = colourVariants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <div key={colourName}>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-estei-gray-500">
                    <span
                      className="h-3 w-3 rounded-full border border-estei-gray-200"
                      style={{ backgroundColor: swatch?.hex ?? "#9a9a9a" }}
                    />
                    {colourName} · {colourTotal} units
                  </p>
                  <ul className="divide-y divide-estei-gray-100">
                    {colourVariants.map((v) => (
                      <li key={v.id} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-estei-gray-900">Size {v.size}</p>
                          <p className="text-xs text-estei-gray-400">{v.sku}</p>
                        </div>
                        <StockStepper
                          productId={product.id}
                          variantId={v.id}
                          size={v.size}
                          initialStock={v.stock}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 border-t border-estei-gray-100 pt-5">
          <p className="mb-2 text-xs font-medium text-estei-gray-500">
            Add another colour (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {addableColours.map((c) => {
              const active = newColours.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() =>
                    setNewColours((prev) =>
                      prev.includes(c.name) ? prev.filter((n) => n !== c.name) : [...prev, c.name]
                    )
                  }
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-estei-red bg-estei-red-tint text-estei-red"
                      : "border-estei-gray-200 text-estei-gray-600 hover:border-estei-gray-400"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-estei-gray-200"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>

          {newColours.map((colourName) => {
            const swatch = COLOUR_SWATCHES.find((c) => c.name === colourName);
            const sizes = availableSizes(colourName);
            return (
              <div key={colourName} className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-estei-gray-500">
                  <span
                    className="h-3 w-3 rounded-full border border-estei-gray-200"
                    style={{ backgroundColor: swatch?.hex }}
                  />
                  {colourName} — stock per size
                </p>
                {sizes.length === 0 ? (
                  <p className="text-xs text-estei-gray-400">All sizes already exist for this colour.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {sizes.map((size) => (
                      <label key={size} className="flex flex-col gap-1">
                        <span className="text-xs text-estei-gray-400">{size}</span>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          inputMode="numeric"
                          value={newSizes[colourSizeKey(colourName, size)] ?? ""}
                          onChange={(e) =>
                            setNewSizes((prev) => ({
                              ...prev,
                              [colourSizeKey(colourName, size)]: e.target.value,
                            }))
                          }
                          className="h-9 px-2 text-sm"
                          placeholder="0"
                          aria-label={`Stock for new ${colourName} size ${size}`}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <p className="mt-3 text-xs text-estei-gray-400">
            Leave blank to skip. New variants are created when you save.
          </p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/products")} disabled={saving}>
          Back to products
        </Button>
      </div>
    </div>
  );
}
