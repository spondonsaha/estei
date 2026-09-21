"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send, CheckCircle2, Copy, Phone, Gift, BarChart3, MapPin, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { dealerApplicationSchema } from "@/lib/validations";
import { MONTHLY_DEMAND_OPTIONS } from "@/lib/dealer-ui";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentDropzone, type UploadedDoc } from "@/components/dealer/document-dropzone";
import { FieldLabel } from "@/components/dealer/field-label";

export type SellPackageOption = {
  id: string;
  name: string;
  description: string | null;
  minPairs: number;
  maxPairs: number | null;
};

type FormValues = {
  phone: string;
  packageId: string;
  monthlyDemand: "" | "D_50_100" | "D_101_300" | "D_301_500" | "D_501_1000" | "D_1000_PLUS";
  businessLoc: string;
  consent: boolean;
  nidKeys: string[];
  locationKeys: string[];
};

const MONTHLY_OPTIONS = MONTHLY_DEMAND_OPTIONS;

function keysOf(docs: UploadedDoc[]): string[] {
  return docs.filter((d) => d.storageKey && !d.uploading && !d.error).map((d) => d.storageKey);
}

export function DealerRegistrationForm({ packages }: { packages: SellPackageOption[] }) {
  const [nidDocs, setNidDocs] = useState<UploadedDoc[]>([]);
  const [locationDocs, setLocationDocs] = useState<UploadedDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const [refNumber, setRefNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(dealerApplicationSchema),
    defaultValues: {
      phone: "",
      packageId: "",
      monthlyDemand: "",
      businessLoc: "",
      consent: false,
      nidKeys: [],
      locationKeys: [],
    },
  });

  const consent = watch("consent");

  // Keep the document keys in RHF state in sync with the dropzones so
  // submit-time validation sees the latest uploads.
  const syncNidKeys = useCallback(
    (next: UploadedDoc[]) => setValue("nidKeys", keysOf(next), { shouldValidate: true }),
    [setValue]
  );
  const syncLocationKeys = useCallback(
    (next: UploadedDoc[]) => setValue("locationKeys", keysOf(next), { shouldValidate: true }),
    [setValue]
  );

  const setNid = useCallback(
    (updater: React.SetStateAction<UploadedDoc[]>) => {
      setNidDocs((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        syncNidKeys(next);
        return next;
      });
    },
    [syncNidKeys]
  );

  const setLocation = useCallback(
    (updater: React.SetStateAction<UploadedDoc[]>) => {
      setLocationDocs((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        syncLocationKeys(next);
        return next;
      });
    },
    [syncLocationKeys]
  );

  async function onSubmit(_values: FormValues) {
    void trigger(["nidKeys", "locationKeys"]);
    if (nidDocs.some((d) => d.uploading) || locationDocs.some((d) => d.uploading)) {
      toast.error("Please wait for the current uploads to finish.");
      return;
    }
    const invalid = [...nidDocs, ...locationDocs].find((d) => d.error);
    if (invalid) {
      toast.error(`${invalid.fileName} failed to upload. Please remove and re-upload it.`);
      return;
    }

    const values = {
      phone: _values.phone,
      packageId: _values.packageId,
      monthlyDemand: _values.monthlyDemand,
      businessLoc: _values.businessLoc,
      consent: _values.consent,
      nidKeys: keysOf(nidDocs),
      locationKeys: keysOf(locationDocs),
    };

    setBusy(true);
    try {
      const res = await fetch("/api/dealer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as { ok: boolean; refNumber?: string; error?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Failed to submit application");
        return;
      }
      if (json.refNumber) {
        setRefNumber(json.refNumber);
        toast.success("Application submitted!");
      }
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setBusy(false);
    }
  }

  async function copyRef() {
    if (!refNumber) return;
    try {
      await navigator.clipboard.writeText(refNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  if (refNumber) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 className="h-14 w-14 text-[#1E9E5A]" />
        <h3 className="mt-4 text-xl font-bold text-[#111827]">Registration Submitted</h3>
        <p className="mt-1 text-sm text-[#4A5568]">Your reference number</p>
        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-[#ECEEF2] bg-[#F7F8FA] px-4 py-3">
          <code className="font-mono text-lg font-bold tracking-wide text-[#111827]">{refNumber}</code>
          <button
            type="button"
            onClick={() => void copyRef()}
            aria-label="Copy reference number"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#8A94A6] transition-colors hover:bg-[#E6EAF2] hover:text-[#111827]"
          >
            {copied ? <Check className="h-4 w-4 text-[#1E9E5A]" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-4 text-sm text-[#4A5568]">We will verify your information and get back to you soon.</p>
        <button
          type="button"
          onClick={() => {
            setRefNumber(null);
            setNid([]);
            setLocation([]);
          }}
          className="mt-5 text-sm font-semibold text-[#F01B24] hover:underline"
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DocumentDropzone
            label="NID Verification (With Face)"
            helperId="nid-helper"
            helperText="Upload your NID card (front & back) with a clear face photo."
            dropLabel="Upload NID & Face Photo"
            maxFiles={3}
            files={nidDocs}
            onChange={setNid}
          />
          <DocumentDropzone
            label="Location Document"
            helperId="location-helper"
            helperText="Upload electricity bill copy or City Corporation document."
            dropLabel="Upload Document"
            maxFiles={2}
            files={locationDocs}
            onChange={setLocation}
          />
        </div>
        {(errors.nidKeys?.message || errors.locationKeys?.message) && (
          <p className="text-xs font-medium text-[#F01B24]" role="alert">
            {errors.nidKeys?.message ?? errors.locationKeys?.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <FieldLabel icon={<Phone className="h-[18px] w-[18px]" />}>Phone Number</FieldLabel>
        <Input
          id="dealer-phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="e.g. 01XXXXXXXXX"
          className="h-[52px] rounded-[10px] border-[#ECEEF2] bg-white placeholder:text-[#8A94A6] focus-visible:border-[#F01B24] focus-visible:ring-4 focus-visible:ring-[#F01B24]/10"
          {...register("phone")}
        />
        {errors.phone && <p className="text-xs font-medium text-[#F01B24]" role="alert">{errors.phone.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <FieldLabel icon={<Gift className="h-[18px] w-[18px]" />}>Attractive Sell Package</FieldLabel>
          <Select onValueChange={(v) => setValue("packageId", v, { shouldValidate: true })}>
            <SelectTrigger
              aria-label="Select a package"
              className="h-[52px] rounded-[10px] border-[#ECEEF2] bg-white text-[#8A94A6] data-[placeholder]:text-[#8A94A6] focus:border-[#F01B24] focus:ring-4 focus:ring-[#F01B24]/10"
            >
              <SelectValue placeholder="Select a package" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="font-semibold text-[#111827]">{p.name}</span>
                  <span className="block text-xs text-[#8A94A6]">
                    {p.description ?? `${p.minPairs}–${p.maxPairs ?? "+∞"} pairs`} pairs/month
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.packageId && <p className="text-xs font-medium text-[#F01B24]" role="alert">{errors.packageId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <FieldLabel icon={<BarChart3 className="h-[18px] w-[18px]" />}>Monthly Demand</FieldLabel>
          <Select onValueChange={(v) => setValue("monthlyDemand", v as FormValues["monthlyDemand"], { shouldValidate: true })}>
            <SelectTrigger
              aria-label="Select monthly demand"
              className="h-[52px] rounded-[10px] border-[#ECEEF2] bg-white text-[#8A94A6] data-[placeholder]:text-[#8A94A6] focus:border-[#F01B24] focus:ring-4 focus:ring-[#F01B24]/10"
            >
              <SelectValue placeholder="Select monthly demand" />
            </SelectTrigger>
            <SelectContent>
              {MONTHLY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.monthlyDemand && <p className="text-xs font-medium text-[#F01B24]" role="alert">{errors.monthlyDemand.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel icon={<MapPin className="h-[18px] w-[18px]" />}>Business Location</FieldLabel>
        <Input
          autoComplete="street-address"
          placeholder="Enter your business address"
          className="h-[52px] rounded-[10px] border-[#ECEEF2] bg-white placeholder:text-[#8A94A6] focus-visible:border-[#F01B24] focus-visible:ring-4 focus-visible:ring-[#F01B24]/10"
          {...register("businessLoc")}
        />
        {errors.businessLoc && <p className="text-xs font-medium text-[#F01B24]" role="alert">{errors.businessLoc.message}</p>}
      </div>

      <div className="rounded-xl border border-[#F8D3D7] bg-[#FDEEF0] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F01B24]">
            <MessageCircle className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <div>
            <h4 className="text-base font-bold text-[#111827]">Dealer Support System (Chatting System)</h4>
            <p className="mt-1 text-sm leading-relaxed text-[#4A5568]">
              Get instant support, product updates and order assistance through our dedicated dealer chat system.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["Quick Response", "Order Support", "Product Updates", "24/7 Assistance"].map((item) => (
            <p key={item} className="flex items-center gap-1.5 text-[0.85rem] font-medium text-[#4A5568]">
              <Check className="h-3.5 w-3.5 shrink-0 text-[#F01B24]" strokeWidth={3} aria-hidden="true" />
              {item}
            </p>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <Checkbox
          checked={consent}
          onCheckedChange={(v) => setValue("consent", v === true, { shouldValidate: true })}
          className="mt-0.5 h-4 w-4"
        />
        <span className="text-sm text-[#4A5568]">
          I confirm the documents are mine and consent to ESTEI verifying them.
          <span className="text-[#F01B24]" aria-hidden="true">*</span>
        </span>
      </label>
      {errors.consent && <p className="text-xs font-medium text-[#F01B24]" role="alert">{errors.consent.message}</p>}

      <Button
        type="submit"
        disabled={busy}
        className="h-14 w-full rounded-[10px] bg-[#F01B24] text-[1.05rem] font-bold hover:bg-[#D4141C] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        Submit Registration
      </Button>
      <p className="text-center text-[0.85rem] text-[#8A94A6]">
        We will verify your information and get back to you soon.
      </p>
    </form>
  );
}