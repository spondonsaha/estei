"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { dealerSchema } from "@/lib/validations";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS_TYPES } from "@/lib/constants";
import { SUPPORT_PHONE } from "@/lib/constants";

type FormValues = {
  fullName: string;
  mobile: string;
  email: string;
  businessName: string;
  district?: string;
  businessType?: string;
  address: string;
  yearsInBiz: string;
  message: string;
};

export function DealerForm({ districts }: { districts: string[] }) {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(dealerSchema) });

  async function onSubmit(values: FormValues) {
    setBusy(true);
    try {
      const res = await fetch("/api/dealer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { refNumber: string } };
      if (!res.ok) {
        if (json.error?.toLowerCase().includes("already")) {
          toast.error(json.error);
        } else {
          toast.error(json.error ?? "Failed to submit application");
        }
        return;
      }
      setSubmitted(json.data!.refNumber);
      toast.success("Application submitted!");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-estei-gray-200 bg-white p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-14 w-14 text-estei-success" />
        <h3 className="mt-4 text-xl font-bold text-estei-gray-900">Application Received!</h3>
        <p className="mt-2 text-sm text-estei-gray-600">Your application reference number is</p>
        <p className="mt-3 inline-block rounded-md bg-estei-red-tint px-4 py-2 font-display text-lg font-bold text-estei-red">
          {submitted}
        </p>
        <p className="mt-4 text-sm text-estei-gray-600">
          We&apos;ll get back to you within 24 hours. For urgent inquiries, call us at{" "}
          <a href="tel:+8801700000000" className="font-semibold text-estei-red">
            {SUPPORT_PHONE}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" placeholder="Your full name" {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-estei-red">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mobile">Mobile Number *</Label>
          <Input id="mobile" placeholder="017xxxxxxxx" {...register("mobile")} />
          {errors.mobile && <p className="text-xs text-estei-red">{errors.mobile.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input id="businessName" placeholder="Your business name" {...register("businessName")} />
          {errors.businessName && <p className="text-xs text-estei-red">{errors.businessName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>District *</Label>
          <Select
            onValueChange={(v) => setValue("district", v, { shouldValidate: true })}
          >
            <SelectTrigger aria-label="Select district">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.district && <p className="text-xs text-estei-red">{errors.district.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Select Business Type *</Label>
          <Select onValueChange={(v) => setValue("businessType", v, { shouldValidate: true })}>
            <SelectTrigger aria-label="Select business type">
              <SelectValue placeholder="Business type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((b) => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.businessType && <p className="text-xs text-estei-red">{errors.businessType?.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs text-estei-red">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yearsInBiz">Years in Business (optional)</Label>
          <Input id="yearsInBiz" type="number" min={0} max={100} placeholder="5" {...register("yearsInBiz")} />
          {errors.yearsInBiz && <p className="text-xs text-estei-red">{errors.yearsInBiz.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Business Address (optional)</Label>
        <Input id="address" placeholder="Shop / office address" {...register("address")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea id="message" placeholder="Tell us a bit about your business..." {...register("message")} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Submit Application
      </Button>
      <p className="text-center text-xs text-estei-gray-400">We&apos;ll get back to you within 24 hours.</p>
      <p className="flex items-center justify-center gap-1.5 text-center text-sm font-medium text-estei-red">
        <Phone className="h-4 w-4" /> {SUPPORT_PHONE}
      </p>
    </form>
  );
}