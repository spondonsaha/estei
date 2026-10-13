import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  dark = false,
  size = "md",
}: {
  className?: string;
  dark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (dark) {
    return (
      <Image
        src="/logo-horizontal.jpeg"
        alt="ESTEI"
        width={988}
        height={305}
        sizes="(min-width: 1024px) 130px, 104px"
        className={cn(
          "h-auto w-auto shrink-0 object-contain",
          size === "sm" && "h-6",
          size === "md" && "h-8",
          size === "lg" && "h-10",
          size === "xl" && "h-12",
          className
        )}
        priority
      />
    );
  }

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