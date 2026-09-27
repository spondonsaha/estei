"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Loader2, Lock } from "lucide-react";
import { checkoutSchema } from "@/lib/validations";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  district: string;
  city: string;
  thana: string;
  area: string;
  addressLine: string;
  postalCode: string;
  paymentMethod: "COD" | "BKASH" | "NAGAD" | "CARD";
  notes: string;
  saveAddress?: boolean;
};

const PAYMENT_OPTIONS: { value: FormValues["paymentMethod"]; label: string; note: string }[] = [
  { value: "COD", label: "Cash on Delivery", note: "Pay in cash when your order arrives" },
  { value: "BKASH", label: "bKash", note: "Pay via bKash merchant" },
  { value: "NAGAD", label: "Nagad", note: "Pay via Nagad merchant" },
  { value: "CARD", label: "Card", note: "Visa / Mastercard" },
];

type District = { name: string; shippingFee: string };

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, subtotalRaw, clear, sessionId } = useCart();
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [saveAddress, setSaveAddress] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "COD", email: "" },
  });

  const paymentMethod = watch("paymentMethod");
  const districtName = watch("district");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      setValue("email", session.user.email);
    }
  }, [status, session, setValue]);

  useEffect(() => {
    fetch("/api/districts")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setDistricts(json.data as District[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!districts.length || lines.length === 0) return;
    if (!districtName) {
      setValue("district", "Dhaka", { shouldValidate: true });
    }
  }, [districts, setValue, districtName, lines.length]);

  const shippingFee = useMemo(() => {
    const d = districts.find((x) => x.name === districtName);
    return d ? Number(d.shippingFee) : 0;
  }, [districts, districtName]);

  const total = subtotalRaw + shippingFee;
  const itemCount = lines.reduce((a, l) => a + l.quantity, 0);
  const outOfStock = lines.filter((l) => l.stock === 0);

  async function onSubmit(values: FormValues) {
    if (lines.length === 0) {
      toast.error("Your cart is empty");
      router.push("/cart");
      return;
    }
    if (outOfStock.length > 0) {
      toast.error(
        outOfStock.length === 1
          ? `${outOfStock[0].productName} (Size ${outOfStock[0].size}) is out of stock. Please remove it to continue.`
          : `${outOfStock.length} items in your cart are out of stock. Please remove them to continue.`
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": sessionId ?? "" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
          address: {
            fullName: values.fullName,
            email: values.email,
            phone: values.phone,
            district: values.district,
            city: values.city,
            thana: values.thana,
            area: values.area,
            addressLine: values.addressLine,
            postalCode: values.postalCode,
            paymentMethod: values.paymentMethod,
            notes: values.notes,
          },
          saveAddress,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { orderNumber: string; viewToken?: string };
      };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to place order");
        return;
      }
      await clear();
      toast.success("Order placed successfully!");
      const order = json.data!;
      router.push(`/order/${order.orderNumber}${order.viewToken ? `?token=${encodeURIComponent(order.viewToken)}` : ""}`);
    } catch {
      toast.error("Failed to place order");
    } finally {
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-estei-gray-900">Your cart is empty</p>
        <Button className="mt-4" onClick={() => router.push("/category/mens")}>Start Shopping</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-3" noValidate>
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-estei-gray-900">Shipping Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" placeholder="Recipient name" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-estei-red">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              <p className="text-xs text-estei-gray-400">Order confirmation will be sent here</p>
              {errors.email && <p className="text-xs text-estei-red">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile *</Label>
              <Input id="phone" placeholder="017xxxxxxxx" {...register("phone")} />
              {errors.phone && <p className="text-xs text-estei-red">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>District *</Label>
              <Select value={districtName || undefined} onValueChange={(v) => setValue("district", v, { shouldValidate: true })}>
                <SelectTrigger aria-label="Select district">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {districts.map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name} (৳{Number(d.shippingFee).toLocaleString("en-BD")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.district && <p className="text-xs text-estei-red">{errors.district.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="thana">Thana *</Label>
              <Input id="thana" placeholder="e.g. Mirpur" {...register("thana")} />
              {errors.thana && <p className="text-xs text-estei-red">{errors.thana.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City (optional)</Label>
              <Input id="city" placeholder="City" {...register("city")} />
              {errors.city && <p className="text-xs text-estei-red">{errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area">Area (optional)</Label>
              <Input id="area" placeholder="Area / Road" {...register("area")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Postal Code (optional)</Label>
              <Input id="postalCode" placeholder="1207" {...register("postalCode")} />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="addressLine">Full Address *</Label>
            <Textarea id="addressLine" placeholder="House, road, area..." {...register("addressLine")} />
            {errors.addressLine && <p className="text-xs text-estei-red">{errors.addressLine.message}</p>}
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="notes">Order Notes (optional)</Label>
            <Textarea id="notes" placeholder="Any special instructions..." {...register("notes")} />
          </div>
        </section>

        <section className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-estei-gray-900">Payment Method</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PAYMENT_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border p-4",
                  paymentMethod === o.value ? "border-estei-red bg-estei-red-tint" : "border-estei-gray-200"
                )}
              >
                <input
                  type="radio"
                  className="mt-1 accent-estei-red"
                  {...register("paymentMethod")}
                  value={o.value}
                  onChange={() => setValue("paymentMethod", o.value, { shouldValidate: true })}
                />
                <div>
                  <p className="text-sm font-semibold text-estei-gray-900">{o.label}</p>
                  <p className="text-xs text-estei-gray-400">{o.note}</p>
                </div>
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-estei-gray-900">Order Summary</h2>
        <ul className="max-h-64 space-y-3 overflow-y-auto">
          {lines.map((line) => (
            <li key={line.id} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-estei-gray-100">
                <Image src={line.image} alt={line.productName} fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-estei-gray-900 line-clamp-1">{line.productName}</p>
                <p className="text-xs text-estei-gray-400">
                  {line.colourName} · {line.size} · ×{line.quantity}
                </p>
                {line.stock === 0 && (
                  <p className="mt-0.5 text-xs font-semibold text-estei-red">Out of stock</p>
                )}
              </div>
              {line.stock === 0 ? (
                <span className="text-sm font-semibold text-estei-red line-through">
                  {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(line.unitPrice) * line.quantity)}
                </span>
              ) : (
                <span className="text-sm font-semibold text-estei-gray-900">
                  {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(line.unitPrice) * line.quantity)}
                </span>
              )}
            </li>
          ))}
        </ul>

        {outOfStock.length > 0 && (
          <div className="mt-4 rounded-md bg-estei-red-tint px-4 py-3 text-sm text-estei-red">
            {outOfStock.length === 1 ? (
              <>
                <strong>{outOfStock[0].productName}</strong> (Size {outOfStock[0].size},{" "}
                {outOfStock[0].colourName}) is out of stock. Please remove it from your cart to
                continue.
              </>
            ) : (
              <>
                <strong>{outOfStock.length} items</strong> in your cart are out of stock. Please
                remove them to continue.
              </>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2 border-t border-estei-gray-200 pt-4 text-sm">
          <div className="flex justify-between text-estei-gray-600">
            <span>Subtotal ({itemCount} items)</span>
            <span className="font-medium text-estei-gray-900">{subtotal}</span>
          </div>
          <div className="flex justify-between text-estei-gray-600">
            <span>Delivery</span>
            <span className="font-medium text-estei-gray-900">
              {shippingFee > 0 ? `৳${shippingFee.toLocaleString("en-BD")}` : "—"}
            </span>
          </div>
          <div className="flex justify-between border-t border-estei-gray-200 pt-3 text-base">
            <span className="font-semibold text-estei-gray-900">Total</span>
            <span className="font-bold text-estei-red">
              ৳{total.toLocaleString("en-BD")}
            </span>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-estei-gray-600">
          <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-estei-red" />
          Save this address to my account
        </label>

        <Button
          type="submit"
          size="lg"
          className="mt-4 w-full"
          disabled={busy || lines.length === 0 || outOfStock.length > 0}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Place Order · ৳{total.toLocaleString("en-BD")}
        </Button>
        {outOfStock.length > 0 && (
          <p className="mt-2 text-center text-xs font-medium text-estei-red">
            Remove out of stock items to place your order
          </p>
        )}
        <p className="mt-3 text-center text-xs text-estei-gray-400">
          By placing this order you agree to our Terms &amp; Conditions.
        </p>
      </aside>
    </form>
  );
}