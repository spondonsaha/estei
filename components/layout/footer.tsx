"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Facebook, Instagram, Mail, Youtube } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to subscribe");
      setEmail("");
      toast.success("Subscribed! Welcome to ESTEI.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="bg-estei-black text-estei-gray-400">
      <div className="container-estei grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo dark />
          <p className="mt-3 text-sm">Step Forward</p>
          <p className="mt-4 text-xs leading-relaxed">
            Bangladeshi footwear manufacturer delivering comfort, style and durability since day one.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/", label: "Home" },
              { href: "/category/mens", label: "Men's" },
              { href: "/category/womens", label: "Women's" },
              { href: "/category/casual", label: "Casual" },
              { href: "/category/formal", label: "Formal" },
              { href: "/category/sports", label: "Sports" },
              { href: "/category/new-arrival", label: "New Arrival" },
              { href: "/category/best-sellers", label: "Best Sellers" },
              { href: "/dealer", label: "Become a Dealer!" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-estei-red">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Customer Care</h3>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/delivery-information", label: "Delivery Information" },
              { href: "/cod-information", label: "COD Information" },
              { href: "/return-exchange-policy", label: "Return & Exchange Policy" },
              { href: "/faq", label: "FAQ" },
              { href: "/contact", label: "Contact Us" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-estei-red">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            {[
              { href: "https://facebook.com", label: "Facebook", Icon: Facebook },
              { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
              { href: "https://youtube.com", label: "YouTube", Icon: Youtube },
              { href: "https://tiktok.com", label: "TikTok", Icon: MusicNoteIcon },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-estei-red hover:bg-estei-red"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Subscribe to our newsletter</h3>
          <p className="mb-4 text-sm">Get the latest updates, offers and more.</p>
          <form onSubmit={subscribe} className="flex items-center">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="h-11 rounded-r-none border-white/15 bg-white/10 text-white placeholder:text-estei-gray-400"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label="Subscribe"
              className="flex h-11 w-12 shrink-0 items-center justify-center rounded-r-md bg-estei-red text-white transition-colors hover:bg-estei-red-hover disabled:opacity-60"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-estei-gray-400">
            <Mail className="h-3.5 w-3.5" /> support@estei.com.bd
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-estei flex flex-col items-center justify-between gap-3 py-4 text-xs text-estei-gray-400 sm:flex-row">
          <p>© 2025 ESTEI. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="transition-colors hover:text-white">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16" aria-hidden="true">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h6V3H9z" />
    </svg>
  );
}