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
      position="top-center"
      richColors
      offset={12}
      toastOptions={{
        // Error messages are now explanatory and can run long, so the toast has
        // to wrap and stay inside the viewport on narrow screens instead of
        // stretching past the edge.
        classNames: {
          toast:
            "group toast w-full max-w-[calc(100vw-2rem)] sm:max-w-sm group-[.toaster]:bg-white group-[.toaster]:text-estei-gray-900 group-[.toaster]:border-estei-gray-200 group-[.toaster]:shadow-card",
          title: "break-words text-sm font-medium leading-snug",
          description: "break-words text-xs leading-relaxed group-[.toast]:text-estei-gray-600",
          actionButton: "group-[.toast]:bg-estei-red group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-estei-gray-100 group-[.toast]:text-estei-gray-600",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };