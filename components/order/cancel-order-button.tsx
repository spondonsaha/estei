"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({
  orderNumber,
  label = "Cancel Order",
}: {
  orderNumber: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onCancel() {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: "POST" });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to cancel order");
        return;
      }
      toast.success("Order cancelled successfully");
      router.refresh();
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-estei-red text-estei-red hover:bg-estei-red-tint hover:text-estei-red"
      onClick={() => void onCancel()}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {busy ? "Cancelling..." : label}
    </Button>
  );
}