"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { contactSchema } from "@/lib/validations";
import { Input, Textarea } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: FormValues) {
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to send message");
        return;
      }
      toast.success("Message sent! We'll get back to you within 24 hours.");
      reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Full Name *</Label>
          <Input id="c-name" placeholder="Your name" {...register("name")} />
          {errors.name && <FieldError message={errors.name?.message} />}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email *</Label>
          <Input id="c-email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <FieldError message={errors.email?.message} />}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-phone">Mobile (optional)</Label>
          <Input id="c-phone" placeholder="017xxxxxxxx" {...register("phone")} />
          {errors.phone && <FieldError message={errors.phone?.message} />}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-subject">Subject *</Label>
          <Input id="c-subject" placeholder="How can we help?" {...register("subject")} />
          {errors.subject && <FieldError message={errors.subject?.message} />}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-message">Message *</Label>
        <Textarea id="c-message" rows={5} placeholder="Write your message..." {...register("message")} />
        {errors.message && <FieldError message={errors.message?.message} />}
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send Message
      </Button>
    </form>
  );
}