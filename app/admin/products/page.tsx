"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { COLOUR_SWATCHES, MEN_SIZE_SET, WOMEN_SIZE_SET } from "@/lib/constants";

const GENDERS = ["MEN", "WOMEN", "UNISEX"] as const;

type Gender = (typeof GENDERS)[number];

type Category = { id: string; name: string };

const SIZE_SETS: Record<Gender, string[]> = {
  MEN: [...MEN_SIZE_SET],
  WOMEN: [...WOMEN_SIZE_SET],
  UNISEX: [...new Set([...MEN_SIZE_SET, ...WOMEN_SIZE_SET])],
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  gender: Gender;
  price: string;
  compareAtPrice: string | null;
  isActive: boolean;
  stock: number;
  sizes: string[];
  category: string;
  reviewCount: number;
};

type Page = { products: ProductRow[]; total: number; page: number; pageCount: number };

export default function AdminProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [gender, setGender] = useState<Gender>("UNISEX");
  const [colourName, setColourName] = useState(COLOUR_SWATCHES[0].name);
  const [stock, setStock] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/categories");
        const json = (await res.json()) as { ok: boolean; data?: Category[] };
        if (active && json.ok && json.data) setCategories(json.data);
      } catch {
        /* category list is non-critical for the table */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function resetForm() {
    setCategoryId("");
    setGender("UNISEX");
    setColourName(COLOUR_SWATCHES[0].name);
    setStock({});
  }

  const load = useCallback(async (pageNum: number, query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?page=${pageNum}&q=${encodeURIComponent(query)}`);
      const json = (await res.json()) as { ok: boolean; data?: Page };
      if (json.ok && json.data) {
        setRows(json.data.products);
        setTotal(json.data.total);
        setPage(json.data.page);
        setPageCount(json.data.pageCount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, q);
  }, [page, q, load]);

  async function createProduct(formData: FormData) {
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    const swatch = COLOUR_SWATCHES.find((c) => c.name === colourName) ?? COLOUR_SWATCHES[0];
    const variants = SIZE_SETS[gender]
      .map((size) => ({ size, colourName: swatch.name, colourHex: swatch.hex, stock: Number(stock[size] ?? 0) }))
      .filter((v) => Number.isFinite(v.stock) && v.stock > 0);
    if (variants.length === 0) {
      toast.error("Enter a stock quantity for at least one size");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          slug: formData.get("slug"),
          sku: formData.get("sku"),
          price: Number(formData.get("price")),
          description: formData.get("description") ?? "Lightweight, breathable and stylish.",
          material: formData.get("material") ?? "Mesh Upper, EVA Sole",
          categoryId,
          gender,
          variants,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { totalStock: number; variantCount: number };
      };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create product");
        return;
      }
      toast.success(
        `Product created — ${json.data?.variantCount ?? variants.length} sizes, ${json.data?.totalStock ?? 0} in stock`
      );
      setDialogOpen(false);
      resetForm();
      void load(1, q);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: ProductRow) {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // PATCH is a partial update, so only the flag is sent. Sending the whole
      // product here used to overwrite description and material with placeholders.
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      toast.error(json?.error ?? "Failed to update product");
      return;
    }
    toast.success(p.isActive ? "Product deactivated" : "Product activated");
    void load(page, q);
  }

  async function removeProduct(p: ProductRow) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed to delete");
      return;
    }
    toast.success("Product deleted");
    void load(page, q);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-estei-gray-900">Products</h1>
          <p className="text-sm text-estei-gray-400">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-estei-gray-200 px-3">
            <Search className="h-4 w-4 text-estei-gray-400" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="border-0 focus-visible:ring-0 w-40"
            />
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Product</DialogTitle>
                <DialogDescription>Add a new product. Add images and variants in the seed or via SQL for now.</DialogDescription>
              </DialogHeader>
              <form action={createProduct} className="space-y-4">
                <Input name="name" required placeholder="Name (e.g. ESTEI Runner 01)" />
                <Input name="slug" required placeholder="Slug (e.g. estei-runner-01)" />
                <Input name="sku" required placeholder="SKU (e.g. ESTEI-RUNNER-01)" />
                <Input name="price" required type="number" min={1} step="0.01" placeholder="Price (৳)" />
                <Input name="material" placeholder="Material (default: Mesh Upper, EVA Sole)" />
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger aria-label="Select category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No categories available
                      </SelectItem>
                    ) : (
                      categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={gender}
                  onValueChange={(v) => {
                    setGender(v as Gender);
                    setStock({});
                  }}
                >
                  <SelectTrigger aria-label="Select gender">
                    <SelectValue placeholder="Select a gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={colourName} onValueChange={setColourName}>
                  <SelectTrigger aria-label="Select colour">
                    <SelectValue placeholder="Select a colour" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOUR_SWATCHES.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <p className="mb-2 text-xs font-medium text-estei-gray-500">
                    Stock per size (0 or blank = out of stock)
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {SIZE_SETS[gender].map((size) => (
                      <label key={size} className="flex flex-col gap-1">
                        <span className="text-xs text-estei-gray-400">{size}</span>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          inputMode="numeric"
                          value={stock[size] ?? ""}
                          onChange={(e) =>
                            setStock((prev) => ({ ...prev, [size]: e.target.value }))
                          }
                          className="h-9 px-2 text-sm"
                          placeholder="0"
                          aria-label={`Stock for size ${size}`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving || !categoryId}>
                    {saving ? "Saving..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-estei-gray-200 bg-white shadow-card">
        {loading ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-estei-gray-400">No products found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-estei-gray-100 text-left text-estei-gray-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Reviews</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-estei-gray-100 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-estei-gray-900">{p.name}</p>
                    <p className="text-xs text-estei-gray-400">/{p.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-estei-gray-600">{p.sku}</td>
                  <td className="px-5 py-3 text-estei-gray-600">{p.category}</td>
                  <td className="px-5 py-3 font-semibold text-estei-red">{formatPrice(p.price)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`font-semibold ${p.stock === 0 ? "text-estei-red" : p.stock <= 5 ? "text-estei-star" : "text-estei-success"}`}
                    >
                      {p.stock}
                    </span>
                    <p className="text-xs text-estei-gray-400">
                      {p.sizes.length > 0 ? `${p.sizes.length} sizes` : "no variants"}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-estei-gray-600">{p.reviewCount}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => void toggleActive(p)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.isActive ? "bg-estei-success/10 text-estei-success" : "bg-estei-gray-100 text-estei-gray-400"}`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-sm font-medium text-estei-gray-600 hover:text-estei-red"
                      >
                        Edit
                      </Link>
                      <button onClick={() => void removeProduct(p)} className="text-estei-gray-400 hover:text-estei-red" aria-label={`Delete ${p.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-estei-gray-100 px-5 py-3 text-sm">
            <span className="text-estei-gray-400">Page {page} of {pageCount}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}