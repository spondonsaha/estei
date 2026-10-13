"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlideData = {
  id: string;
  titleTop: string;
  titleRed: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

export function HeroSlider({ slides }: { slides: HeroSlideData[] }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [count]);

  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + count) % count);
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    }
  };

  if (count === 0) return null;

  const slide = slides[index];

  return (
    <section className="relative h-[360px] overflow-hidden bg-estei-black sm:h-[560px]" aria-label="Featured collections">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          aria-hidden={i !== index}
        >
          <Image
            src={s.image}
            alt={s.titleRed}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover opacity-70"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-estei-black/90 via-estei-black/60 to-transparent" />

      <div className="container-estei relative z-10 flex h-full flex-col justify-center">
        <div className="max-w-xl">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold uppercase leading-[1.05] tracking-tight text-white">
            {slide.titleTop}
            <br />
            <span className="text-estei-red">{slide.titleRed}</span>
          </h1>
          <p className="mt-4 text-lg text-estei-gray-200">{slide.subtitle}</p>
          <Link href={slide.ctaHref} className="btn-primary mt-8">
            {slide.ctaLabel} →
          </Link>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="absolute bottom-8 right-[6%] z-10 hidden -rotate-6 font-script text-5xl text-white/70 md:block lg:text-6xl"
      >
        Comfort Style Durability
      </span>

      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-estei-red"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-estei-red"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-estei-red" : "w-2 bg-white/60"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}