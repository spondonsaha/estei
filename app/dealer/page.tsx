import type { Metadata } from "next";
import Image from "next/image";
import { Factory, Handshake, Percent, TrendingUp, Palette, Megaphone, LifeBuoy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DealerForm } from "@/components/dealer/dealer-form";
import { TestimonialCarousel } from "@/components/dealer/testimonial-carousel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Become a Dealer",
  description: "Partner with ESTEI and grow your business with a trusted Bangladeshi footwear manufacturer.",
};

const BENEFITS = [
  { icon: Factory, title: "Factory Direct Supply", sub: "Get products directly from our own factory." },
  { icon: Percent, title: "Competitive Dealer Price", sub: "Better margin. Higher profit." },
  { icon: TrendingUp, title: "Attractive Profit Margin", sub: "More sales. More earnings." },
  { icon: Palette, title: "Regular New Designs", sub: "Stay ahead with the latest styles." },
  { icon: Megaphone, title: "Marketing Support", sub: "We'll support your growth." },
  { icon: LifeBuoy, title: "Dedicated Support", sub: "Get help whenever you need." },
];

export default async function DealerPage() {
  const [districts, testimonials] = await Promise.all([
    prisma.district.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <section className="relative h-[320px] bg-estei-black">
        <Image
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=80"
          alt="Business partnership"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-estei-black/90 to-estei-black/40" />
        <div className="container-estei relative z-10 flex h-full flex-col justify-center">
          <h1 className="font-display text-4xl font-bold text-white">
            Become Our Authorized <span className="text-estei-red">Dealer!</span>
          </h1>
          <p className="mt-3 max-w-xl text-estei-gray-200">
            Partner with ESTEI and grow your business with a trusted footwear manufacturer.
          </p>
          <a href="#dealer-form" className="btn-primary mt-6 w-fit">
            Apply Now →
          </a>
        </div>
      </section>

      <section className="section-estei">
        <div className="container-estei grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-estei-gray-900">Why Become a Dealer?</h2>
            <div className="mt-6 space-y-5">
              {BENEFITS.map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-estei-red-tint text-estei-red">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-estei-gray-900">{title}</p>
                    <p className="text-sm text-estei-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-lg bg-estei-black p-6">
              <div className="flex items-center gap-3 text-white">
                <Handshake className="h-6 w-6 text-estei-red" />
                <p className="text-sm">
                  <span className="font-semibold">Already a dealer?</span>{" "}
                  <span className="text-estei-gray-400">Get in touch to reorder your bestsellers.</span>
                </p>
              </div>
            </div>
          </div>

          <div id="dealer-form" className="scroll-mt-24 rounded-lg border border-estei-gray-200 bg-white p-8 shadow-card">
            <h2 className="mb-1 text-xl font-bold text-estei-gray-900">Dealer Registration Form</h2>
            <p className="mb-6 text-sm text-estei-gray-400">Fill in the form and our team will contact you.</p>
            <DealerForm districts={districts.map((d) => d.name)} />
          </div>
        </div>
      </section>

      <section className="section-estei bg-estei-gray-100">
        <div className="container-estei">
          <h2 className="mb-8 text-center text-2xl font-bold text-estei-gray-900">What Our Customers Say</h2>
          <TestimonialCarousel
            items={testimonials.map((t) => ({
              id: t.id,
              name: t.name,
              role: t.role,
              quote: t.quote,
              rating: t.rating,
            }))}
          />
        </div>
      </section>
    </>
  );
}