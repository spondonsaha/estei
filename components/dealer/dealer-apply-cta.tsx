"use client";

import { ArrowRight } from "lucide-react";

export function DealerApplyCta() {
  return (
    <button
      type="button"
      onClick={() => {
        const form = document.getElementById("dealer-registration-form");
        form?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
          const input = document.getElementById("dealer-phone") as HTMLInputElement | null;
          input?.focus({ preventScroll: true });
        }, 650);
      }}
      className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F01B24] px-[34px] py-4 text-[1.1rem] font-bold text-white shadow-[0_6px_20px_rgba(240,27,36,0.35)] transition-colors hover:bg-[#D4141C]"
    >
      Apply Now
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}