import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <Image
      src="/logo.png"
      alt="ESTEI"
      width={700}
      height={399}
      sizes="(min-width: 1024px) 220px, 160px"
      className={cn(
        "w-auto shrink-0 object-contain",
        size === "sm" && "h-6",
        size === "md" && "h-8",
        size === "lg" && "h-11",
        size === "xl" && "h-16",
        className
      )}
      priority
    />
  );
}