"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const RESEND_COOLDOWN = 60;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function sendOtp(email: string) {
    setSending(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { devCode?: string } };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to send verification code");
        return;
      }
      toast.success("Verification code sent to your email");
      if (json.data?.devCode) toast.info(`Dev mode (SMTP not set) — your code: ${json.data.devCode}`);
      startCooldown();
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { requiresOtp?: boolean } };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create account");
        return;
      }
      setRegisteredEmail(values.email.trim().toLowerCase());
      setStep("otp");
      void sendOtp(values.email.trim().toLowerCase());
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, code: otp }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Verification failed");
        return;
      }
      toast.success("Email verified! Please login.");
      router.push("/login");
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="section-estei">
      <div className="container-estei max-w-md">
        {step === "form" ? (
          <div className="rounded-lg border border-estei-gray-200 bg-white p-8 shadow-card">
            <div className="mb-6 flex flex-col items-center text-center">
              <Logo />
              <h1 className="mt-4 text-2xl font-bold text-estei-gray-900">Create Account</h1>
              <p className="mt-1 text-sm text-estei-gray-600">Join ESTEI and start shopping</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" {...register("name")} />
                {errors.name && <FieldError message={errors.name?.message} />}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && <FieldError message={errors.email?.message} />}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile (optional)</Label>
                <Input id="phone" placeholder="017xxxxxxxx" {...register("phone")} />
                {errors.phone && <FieldError message={errors.phone?.message} />}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="At least 6 characters" {...register("password")} />
                {errors.password && <FieldError message={errors.password?.message} />}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Repeat password" {...register("confirmPassword")} />
                {errors.confirmPassword && <FieldError message={errors.confirmPassword?.message} />}
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-center text-xs text-estei-gray-400">
                After creating your account, you&apos;ll receive a 6-digit code to verify your email.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-estei-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-estei-red hover:underline">
                Login
              </Link>
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-estei-gray-200 bg-white p-8 shadow-card">
            <div className="mb-6 flex flex-col items-center text-center">
              <Logo />
              <h1 className="mt-4 text-2xl font-bold text-estei-gray-900">Verify your email</h1>
              <p className="mt-1 text-sm text-estei-gray-600">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-estei-gray-900">{registeredEmail}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !verifying) void onVerify();
                  }}
                />
              </div>
              <Button type="button" className="w-full" onClick={() => void onVerify()} disabled={verifying}>
                {verifying ? "Verifying..." : "Verify Email"}
              </Button>
              <p className="text-center text-sm text-estei-gray-600">
                Didn&apos;t get the code?{" "}
                {cooldown > 0 ? (
                  <span className="text-estei-gray-400">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    className="font-semibold text-estei-red hover:underline disabled:opacity-50"
                    onClick={() => void sendOtp(registeredEmail)}
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-estei-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-estei-red hover:underline">
                Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}