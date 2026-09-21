import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "red" | "dark" | "outline" | "success" | "gold";

const badgeClasses: Record<BadgeVariant, string> = {
  default: "bg-estei-red text-white",
  red: "bg-estei-red-tint text-estei-red border border-estei-red",
  dark: "bg-estei-black text-white",
  outline: "bg-white text-estei-gray-900 border border-estei-gray-200",
  success: "bg-estei-success/10 text-estei-success border border-estei-success/30",
  gold: "bg-estei-star text-white",
};

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        badgeClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };