"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-estei-gray-900 group-[.toaster]:border-estei-gray-200 group-[.toaster]:shadow-card",
          description: "group-[.toast]:text-estei-gray-600",
          actionButton: "group-[.toast]:bg-estei-red group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-estei-gray-100 group-[.toast]:text-estei-gray-600",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };