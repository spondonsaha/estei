import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = 14,
  showValue = false,
  className,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label={`Rated ${rating} out of 5`}>
      <span className="inline-flex items-center" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i + 1 <= Math.floor(rounded);
          const half = !filled && i + 0.5 === rounded;
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star
                style={{ width: size, height: size }}
                className={cn("absolute inset-0 text-estei-star", filled ? "fill-estei-star" : "fill-transparent")}
                strokeWidth={1.5}
              />
              {half && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: size / 2 }}>
                  <Star style={{ width: size, height: size }} className="fill-estei-star text-estei-star" strokeWidth={1.5} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && <span className="text-sm font-medium text-estei-gray-600">{rating.toFixed(1)}</span>}
    </span>
  );
}