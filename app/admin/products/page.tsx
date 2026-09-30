"use client";

import { useCallback, useEffect, useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import { slugify } from "@/lib/slug";
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
import {
  ProductImageUploader,
  type ProductImageEntry,
} from "@/components/admin/product-image-uploader";

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

/** Why the API refused to delete a product. */
type DeleteBlocker = {
  product: ProductRow;
  orderCount: number;
  orderNumbers: string[];
  cartCount: number;
};

export default function AdminProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blocker, setBlocker] = useState<DeleteBlocker | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [gender, setGender] = useState<Gender>("UNISEX");
  const [colours, setColours] = useState<string[]>([COLOUR_SWATCHES[0].name]);
  // stock is keyed by `${colourName}::${size}` so each colour keeps its own quantities.
  const [stock, setStock] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ProductImageEntry[]>([]);
  // Mirrored so the uploader can label files with the SKU being typed above it.
  const [sku, setSku] = useState("");
  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(false);

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
    setColours([]);
    setStock({});
    setImages([]);
    setSku("");
    slugTouched.current = false;
    if (slugRef.current) slugRef.current.value = "";
  }

  /**
   * Destroys images uploaded this session that will never be attached to a
   * product. Called when the dialog closes and when creation fails, otherwise
   * every abandoned upload leaks Cloudinary storage and credit.
   */
  const discardSessionImages = useCallback((entries: ProductImageEntry[]) => {
    const orphans = entries.filter((i) => i.storageKey && !i.persisted).map((i) => i.storageKey);
    if (orphans.length === 0) return;
    void fetch("/api/admin/products/upload/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storageKeys: orphans }),
    }).catch(() => {
      /* a stranded asset costs a fraction of a credit */
    });
  }, []);

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

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    // React 19 auto-resets uncontrolled inputs once a form `action` settles,
    // which wipes the dialog on every validation error. Handling submit
    // ourselves keeps the entered values so the admin can correct and retry.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await createProduct(formData);
  }

  async function createProduct(formData: FormData) {
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (colours.length === 0) {
      toast.error("Select at least one colour");
      return;
    }
    const variants = colours.flatMap((colourName) => {
      const swatch = COLOUR_SWATCHES.find((c) => c.name === colourName) ?? COLOUR_SWATCHES[0];
      return SIZE_SETS[gender]
        .map((size) => ({
          size,
          colourName: swatch.name,
          colourHex: swatch.hex,
          stock: Number(stock[`${colourName}::${size}`] ?? 0),
        }))
        .filter((v) => Number.isFinite(v.stock) && v.stock > 0);
    });
    if (variants.length === 0) {
      toast.error("Enter a stock quantity for at least one size");
      return;
    }
    const productName = String(formData.get("name") ?? "");
    // Drop anything that failed to upload so the API never sees a partial entry.
    const readyImages = images
      .filter((img) => img.storageKey && !img.error)
      .map((img, i) => ({
        url: img.url,
        storageKey: img.storageKey,
        alt: img.alt || productName,
        colour: img.colour || undefined,
        sortOrder: i,
      }));

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
          images: readyImages,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { totalStock: number; variantCount: number };
      };
      if (!res.ok) {
        // The product was not created, so these assets will never be referenced.
        discardSessionImages(images);
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
    const json = (await res.json().catch(() => null)) as {
      ok: boolean;
      error?: string;
      code?: string;
      orderCount?: number;
      orderNumbers?: string[];
      cartCount?: number;
    } | null;

    // The product is still linked to orders or to a customer cart, so the API
    // refuses and explains why. Show the actual reasons rather than a bare
    // "Failed to delete".
    if (json?.code === "PRODUCT_IN_USE") {
      setBlocker({
        product: p,
        orderCount: json.orderCount ?? 0,
        orderNumbers: json.orderNumbers ?? [],
        cartCount: json.cartCount ?? 0,
      });
      return;
    }
    if (!res.ok) {
      toast.error(json?.error ?? "Failed to delete. Please try again.");
      return;
    }
    toast.success("Product deleted");
    void load(page, q);
  }

  async function deactivateFromBlocker() {
    if (!blocker) return;
    const p = blocker.product;
    setBlocker(null);
    if (!p.isActive) {
      toast.success(`"${p.name}" is already inactive`);
      return;
    }
    await toggleActive(p);
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
              if (!open) {
                // Abandoned uploads will never be attached to a product.
                discardSessionImages(images);
                resetForm();
              }
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
                <DialogDescription>
                  Add a new product with one or more colours and stock per size.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <Input
                  name="name"
                  required
                  placeholder="Name (e.g. ESTEI Runner 01)"
                  onChange={(e) => {
                    if (slugTouched.current || !slugRef.current) return;
                    slugRef.current.value = slugify(e.target.value);
                  }}
                />
                <Input
                  name="slug"
                  required
                  ref={slugRef}
                  onChange={() => {
                    slugTouched.current = true;
                  }}
                  placeholder="Slug (e.g. estei-runner-01)"
                />
                <Input
                  name="sku"
                  required
                  placeholder="SKU (e.g. ESTEI-RUNNER-01)"
                  onChange={(e) => setSku(e.target.value)}
                />
                <Input name="price" required type="number" min={1} step="0.01" placeholder="Price (৳)" />
                <Input name="material" placeholder="Material (default: Mesh Upper, EVA Sole)" />
                <ProductImageUploader
                  sku={sku}
                  colourOptions={colours}
                  images={images}
                  onChange={setImages}
                />
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
                <div>
                  <p className="mb-2 text-xs font-medium text-estei-gray-500">
                    Colours (select one or more)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COLOUR_SWATCHES.map((c) => {
                      const active = colours.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() =>
                            setColours((prev) =>
                              prev.includes(c.name)
                                ? prev.filter((n) => n !== c.name)
                                : [...prev, c.name]
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
                </div>
                {colours.map((colourName) => {
                  const swatch = COLOUR_SWATCHES.find((c) => c.name === colourName);
                  return (
                    <div key={colourName}>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-estei-gray-500">
                        <span
                          className="h-3 w-3 rounded-full border border-estei-gray-200"
                          style={{ backgroundColor: swatch?.hex }}
                        />
                        {colourName} — stock per size (0 or blank = out of stock)
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
                              value={stock[`${colourName}::${size}`] ?? ""}
                              onChange={(e) =>
                                setStock((prev) => ({
                                  ...prev,
                                  [`${colourName}::${size}`]: e.target.value,
                                }))
                              }
                              className="h-9 px-2 text-sm"
                              placeholder="0"
                              aria-label={`Stock for ${colourName} size ${size}`}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
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

      <Dialog
        open={blocker !== null}
        onOpenChange={(open) => {
          if (!open) setBlocker(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot delete this product</DialogTitle>
            <DialogDescription>
              &quot;{blocker?.product.name}&quot; is still linked to other records, so
              deleting it now would break real order data. Here is exactly what is
              in the way.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-3 text-sm">
            {blocker && blocker.orderCount > 0 && (
              <li className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="font-semibold text-amber-900">
                  Order already placed
                  {blocker.orderCount > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-amber-800">
                  {blocker.orderCount} order{blocker.orderCount > 1 ? "s" : ""} already
                  contain this product, so the order history would be destroyed.
                </p>
                {blocker.orderNumbers.length > 0 && (
                  <p className="mt-1 break-words text-xs text-amber-700">
                    Order numbers: {blocker.orderNumbers.slice(0, 5).join(", ")}
                    {blocker.orderNumbers.length > 5
                      ? ` and ${blocker.orderNumbers.length - 5} more`
                      : ""}
                  </p>
                )}
              </li>
            )}

            {blocker && blocker.cartCount > 0 && (
              <li className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="font-semibold text-amber-900">A customer is holding it in their cart</p>
                <p className="mt-1 text-amber-800">
                  {blocker.cartCount} customer{blocker.cartCount > 1 ? "s are" : " is"}{" "}
                  currently keeping this product in
                  {blocker.cartCount > 1 ? " their carts" : " their cart"}. Remove it from
                  the cart first, or it becomes deletable.
                </p>
              </li>
            )}
          </ul>

          <p className="text-sm text-estei-gray-500">
            If you only want to hide it from the store, deactivate it instead. It will
            disappear from the website but keep all order history intact.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlocker(null)}>
              Close
            </Button>
            {blocker?.product.isActive && (
              <Button onClick={() => void deactivateFromBlocker()}>
                Deactivate instead
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}