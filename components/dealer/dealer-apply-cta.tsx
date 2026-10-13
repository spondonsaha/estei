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
      className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#F01B24] px-6 py-3 text-base font-bold text-white shadow-[0_6px_20px_rgba(240,27,36,0.35)] transition-colors hover:bg-[#D4141C] md:mt-6 md:px-[34px] md:py-4 md:text-[1.1rem]"
    >
      Apply Now
      <ArrowRight className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
    </button>
  );
}