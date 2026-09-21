import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estei-red disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-estei-red text-white hover:bg-estei-red-hover",
        outline: "border border-estei-gray-200 bg-transparent text-estei-gray-900 hover:bg-estei-gray-100",
        outlineLight: "border border-white bg-transparent text-white hover:bg-white/10",
        secondary: "bg-estei-gray-100 text-estei-gray-900 hover:bg-estei-gray-200",
        ghost: "hover:bg-estei-gray-100 hover:text-estei-gray-900",
        link: "text-estei-red underline-offset-4 hover:underline",
        black: "bg-estei-black text-white hover:bg-estei-charcoal",
        success: "bg-estei-success text-white hover:opacity-90",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8",
        icon: "h-10 w-10",
        iconSquare: "h-12 w-12 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };