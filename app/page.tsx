import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Factory, Truck, RotateCcw, ShieldCheck, Sparkles, Headset, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HeroSlider, type HeroSlideData } from "@/components/home/hero-slider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Premium Footwear for Every Journey",
  description: "ESTEI — Bangladeshi footwear manufacturer. Shop men's, women's, casual, formal and sports shoes at factory-direct prices with nationwide delivery.",
};

const TRUST_ITEMS = [
  { icon: Factory, title: "Factory Direct", sub: "Best Price" },
  { icon: ShieldCheck, title: "Premium Quality", sub: "Long Lasting" },
  { icon: Truck, title: "Fast Delivery", sub: "Across Bangladesh" },
  { icon: RotateCcw, title: "Easy Return", sub: "Hassle Free" },
];

const TRUST_ITEMS_2 = [
  { icon: Factory, title: "Made in Our Factory", sub: "Quality You Can Trust" },
  { icon: Sparkles, title: "Modern Designs", sub: "Trendy & Comfortable" },
  { icon: Truck, title: "Nationwide Delivery", sub: "Fast & Reliable" },
  { icon: Headset, title: "Dedicated Support", sub: "We're Here for You" },
];

const DEALER_BENEFITS = [
  "Attractive Profit Margin",
  "Factory Direct Supply",
  "Marketing Support",
  "Dedicated Dealer Support",
];

export default async function HomePage() {
  const [slides, categories] = await Promise.all([
    prisma.heroSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const heroData: HeroSlideData[] = slides;

  return (
    <>
      <HeroSlider slides={heroData} />

      <section className="border-b border-estei-gray-200 bg-estei-gray-100">
        <div className="container-estei grid grid-cols-2 gap-6 py-6 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-estei-red shadow-card">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-estei-gray-900">{title}</p>
                <p className="text-xs text-estei-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-estei">
        <div className="container-estei">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <h2 className="text-center text-2xl font-bold text-estei-gray-900 sm:text-left">Shop by Category</h2>
            <Link href="/category/mens" className="inline-flex items-center gap-1 text-sm font-semibold text-estei-red hover:underline">
              View All →
            </Link>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <span
                key={c.slug}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  c.slug === "mens"
                    ? "border border-estei-red bg-estei-red-tint text-estei-red"
                    : "border border-estei-gray-200 bg-white text-estei-gray-600"
                }`}
              >
                {c.name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group relative overflow-hidden rounded-lg border border-estei-gray-200 bg-white shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-estei-gray-100">
                  <Image
                    src={c.cardImage}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between bg-estei-black px-4 py-3">
                  <span className="text-sm font-medium text-white">{c.name}</span>
                  <ArrowRight className="h-4 w-4 text-estei-red transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-[44px] lg:pb-[72px]">
        <div className="container-estei grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link href="/category/new-arrival" className="group relative block overflow-hidden rounded-lg bg-estei-black">
            <div className="relative h-56">
              <Image
                src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80"
                alt="New arrivals"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover opacity-60 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-8">
              <h3 className="font-display text-2xl font-bold uppercase text-white">New Arrivals</h3>
              <p className="mt-1 text-sm text-estei-gray-200">Fresh styles. More comfort.</p>
              <span className="btn-secondary-dark mt-4 text-sm">Shop New →</span>
            </div>
          </Link>
          <Link href="/category/best-sellers" className="group relative block overflow-hidden rounded-lg bg-estei-black">
            <div className="relative h-56">
              <Image
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"
                alt="Best sellers"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover opacity-60 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-8">
              <h3 className="font-display text-2xl font-bold uppercase text-white">Best Sellers</h3>
              <p className="mt-1 text-sm text-estei-gray-200">Loved by thousands.</p>
              <span className="btn-secondary-dark mt-4 text-sm">Shop Best Sellers →</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="pb-[44px] lg:pb-[72px]">
        <div className="container-estei">
          <div className="relative overflow-hidden rounded-lg bg-estei-black">
            <div className="relative h-64 lg:h-[280px] lg:absolute lg:inset-y-0 lg:left-0 lg:w-1/2">
              <Image
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
                alt="Become a dealer partnership"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-70"
              />
            </div>
            <div className="relative px-8 py-10 lg:ml-[50%] lg:px-12">
              <h2 className="font-display text-3xl font-bold text-white">
                Become a <span className="text-estei-red">Dealer!</span>
              </h2>
              <p className="mt-2 text-estei-gray-200">Grow Your Business with ESTEI</p>
              <ul className="mt-5 space-y-2">
                {DEALER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle2 className="h-5 w-5 text-estei-red" /> {b}
                  </li>
                ))}
              </ul>
              <Link href="/dealer" className="btn-primary mt-6">
                Apply Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-estei-gray-200 bg-estei-gray-100">
        <div className="container-estei grid grid-cols-2 gap-6 py-6 lg:grid-cols-4">
          {TRUST_ITEMS_2.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-estei-red shadow-card">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-estei-gray-900">{title}</p>
                <p className="text-xs text-estei-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}