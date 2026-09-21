"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/star-rating";
import { cn } from "@/lib/utils";

type Testimonial = { id: string; name: string; role: string; quote: string; rating: number };

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  const visible = Array.from({ length: Math.min(3, count) }, (_, off) => items[(index + off) % count]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {visible.map((t) => (
          <figure key={`${t.id}-${index}`} className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
            <StarRating rating={t.rating} size={15} />
            <blockquote className="mt-4 text-sm leading-relaxed text-estei-gray-600">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{t.name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-estei-gray-900">{t.name}</p>
                <p className="text-xs text-estei-gray-400">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {items.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setIndex(i)}
            aria-label={`Show testimonial ${i + 1}`}
            className={cn("h-2.5 rounded-full transition-all", i === index ? "w-6 bg-estei-red" : "w-2.5 bg-estei-gray-200")}
          />
        ))}
      </div>
    </div>
  );
}