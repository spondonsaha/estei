import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  dark = false,
  size = "md",
}: {
  className?: string;
  dark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const wordClass = cn(
    "font-display font-bold tracking-tight",
    dark ? "text-white" : "text-estei-black",
    size === "sm" && "text-lg",
    size === "md" && "text-2xl",
    size === "lg" && "text-3xl"
  );
  const markClass = cn(size === "sm" && "h-6 w-6", size === "md" && "h-8 w-8", size === "lg" && "h-10 w-10");

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-md bg-white",
          dark && "ring-1 ring-white/20",
          markClass
        )}
      >
        <Image
          src="/logo.jpeg"
          alt="ESTEI"
          fill
          sizes="64px"
          className="object-contain"
        />
      </span>
      {dark ? (
        <span className={wordClass}>
          ES<span className="text-estei-black">T</span>EI
        </span>
      ) : (
        <span className={wordClass}>
          ES<span className="text-estei-red">T</span>EI
        </span>
      )}
    </span>
  );
}