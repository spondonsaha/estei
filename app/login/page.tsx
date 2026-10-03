"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

type FormValues = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: FormValues) {
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        // NextAuth collapses every credential failure into one opaque code, so
        // the reason is mapped back to plain guidance here rather than shown raw.
        toast.error("Incorrect email or password", {
          description:
            "Check that your email address is spelled correctly and that your password is right. If you cannot remember your password, contact us and we will help you get back in.",
        });
        return;
      }
      toast.success("Welcome back!");
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="section-estei">
      <div className="container-estei max-w-md">
        <div className="rounded-lg border border-estei-gray-200 bg-white p-8 shadow-card">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo />
            <h1 className="mt-4 text-2xl font-bold text-estei-gray-900">Welcome Back</h1>
            <p className="mt-1 text-sm text-estei-gray-600">Login to your ESTEI account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <FieldError message={errors.email?.message} />}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <FieldError message={errors.password?.message} />}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-estei-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-estei-red hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}