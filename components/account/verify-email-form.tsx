"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

const RESEND_COOLDOWN = 60;

export function VerifyEmailForm({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  async function sendCode() {
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
        body: JSON.stringify({ email, code: otp }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Verification failed");
        return;
      }
      toast.success("Email verified!");
      window.location.href = "/account";
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="rounded-lg border border-estei-gray-200 bg-white p-8 shadow-card">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-4 text-2xl font-bold text-estei-gray-900">Verify your email</h1>
        <p className="mt-1 text-sm text-estei-gray-600">
          We&apos;ll send a 6-digit code to{" "}
          <span className="font-semibold text-estei-gray-900">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <Button type="button" variant="outline" className="w-full" onClick={() => void sendCode()} disabled={sending || cooldown > 0}>
          {sending ? "Sending..." : cooldown > 0 ? `Code sent — resend in ${cooldown}s` : "Send verification code"}
        </Button>

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
      </div>

      <p className="mt-6 text-center text-sm text-estei-gray-600">
        <Link href="/account" className="font-semibold text-estei-gray-900 hover:underline">
          Back to My Account
        </Link>
      </p>
    </div>
  );
}