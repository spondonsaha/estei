import { cn } from "@/lib/utils";

export function HorseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <path
        d="M38 6
           C42 8 44 12 43 16
           C46 15 48 18 47 21
           C50 24 51 28 49 31
           C52 32 53 36 50 37
           C48 40 44 40 42 37
           C40 34 39 30 37 27
           C32 20 26 24 22 30
           C18 34 16 40 18 46
           C19 50 22 54 22 58
           C25 56 26 52 26 48
           C28 42 32 40 36 42
           C40 44 42 48 40 54
           C42 56 45 58 47 58
           C49 54 50 48 56 42
           C60 38 62 34 60 30
           C57 28 54 28 51 30
           C46 22 42 12 38 6
           Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
      <span className={cn("text-estei-red", markClass)}>
        <HorseMark className={markClass} />
      </span>
      <span className={wordClass}>ESTEI</span>
    </span>
  );
}