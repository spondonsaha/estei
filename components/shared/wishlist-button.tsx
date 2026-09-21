"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialActive = false,
  className,
  size = 22,
}: {
  productId: string;
  initialActive?: boolean;
  className?: string;
  size?: number;
}) {
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      setBusy(true);
      try {
        const res = await fetch("/api/wishlist/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const json = (await res.json()) as { ok: boolean; error?: string; data?: { added: boolean } };
        if (!res.ok) {
          if (json.error === "UNAUTHORIZED") {
            router.push("/login");
            toast.info("Please login to use your wishlist");
          } else {
            toast.error(json.error ?? "Something went wrong");
          }
          return;
        }
        setActive(json.data?.added ?? !active);
        toast.success(json.data?.added ? "Added to wishlist" : "Removed from wishlist");
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [busy, active, productId, router]
  );

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      onClick={toggle}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card transition-colors hover:bg-estei-gray-100",
        className
      )}
    >
      <Heart
        style={{ width: size, height: size }}
        className={cn("transition-colors", active ? "fill-estei-red text-estei-red" : "text-estei-gray-400")}
      />
    </button>
  );
}