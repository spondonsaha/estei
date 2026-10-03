import { cn } from "@/lib/utils";

/**
 * Inline, user-facing validation error.
 *
 * Long messages (for example the Bangladeshi phone-number hint) must not push
 * the form wider on a phone or overflow their container, so the text wraps
 * instead of stretching its parent.
 */
export function FieldError({
  message,
  id,
  className,
}: {
  message?: string | null;
  id?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "break-words text-xs leading-relaxed text-estei-red",
        className
      )}
    >
      {message}
    </p>
  );
}