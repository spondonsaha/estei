import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-estei-gray-200 bg-white px-3 py-2 text-sm text-estei-gray-900 placeholder:text-estei-gray-400 focus-visible:outline-none focus-visible:border-estei-red focus-visible:ring-1 focus-visible:ring-estei-red disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[90px] w-full rounded-md border border-estei-gray-200 bg-white px-3 py-2 text-sm text-estei-gray-900 placeholder:text-estei-gray-400 focus-visible:outline-none focus-visible:border-estei-red focus-visible:ring-1 focus-visible:ring-estei-red disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input, Textarea };