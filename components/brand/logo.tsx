import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  dark = false,
  size = "md",
  wordmark = true,
}: {
  className?: string;
  dark?: boolean;
  size?: "sm" | "md" | "lg";
  wordmark?: boolean;
}) {
  const wordClass = cn(
    "font-display font-bold tracking-tight",
    "text-estei-black",
    size === "sm" && "text-lg",
    size === "md" && "text-2xl",
    size === "lg" && "text-3xl"
  );
  const markClass = cn(size === "sm" && "h-6 w-6", size === "md" && "h-8 w-8", size === "lg" && "h-10 w-10");

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
          className
        )}
        priority
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("relative shrink-0 overflow-hidden rounded-md bg-white", markClass)}>
        <Image
          src="/logo.png"
          alt="ESTEI"
          fill
          sizes="64px"
          className="object-contain"
        />
      </span>
      {wordmark && (
        <span className={wordClass}>
          ES<span className="text-estei-red">T</span>EI
        </span>
      )}
    </span>
  );
}