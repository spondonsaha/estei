import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { benefitIcon } from "@/lib/dealer-ui";
import { DealerApplyCta } from "@/components/dealer/dealer-apply-cta";
import { DealerRegistrationForm, type SellPackageOption } from "@/components/dealer/dealer-registration-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Become an Authorized Dealer",
  description:
    "Partner with ESTEI and grow your business with a trusted footwear manufacturer.",
};

type Benefit = { id: string; icon: string; title: string; body: string };

const HERO_SUB =
  "Partner with ESTEI and grow your business with a trusted footwear manufacturer.";

export default async function DealerPage() {
  const [packages, benefits] = await Promise.all([
    prisma.sellPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, description: true, minPairs: true, maxPairs: true },
    }),
    prisma.dealerBenefit.findMany({
      where: { isActive: true },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
      select: { id: true, icon: true, title: true, body: true, section: true },
    }),
  ]);

  const why = benefits.filter((b) => b.section === "WHY") as Benefit[];
  const get = benefits.filter((b) => b.section === "GET") as Benefit[];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-[1240px] space-y-6 px-4 py-6 md:px-6">
        {/* Block 1 — Hero banner */}
        <section
          aria-label="Become a dealer"
          className="relative min-h-[380px] overflow-hidden rounded-[16px] bg-[#1a1a1a] text-white shadow-[0_2px_12px_rgba(16,24,40,0.04)]"
        >
          {/* Dark blurred warehouse backdrop */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[url('/brand-ref.png')] bg-cover bg-center opacity-[0.35] md:opacity-100"
            style={{ objectPosition: "right center" }}
          />
          {/* Red-lit industrial right third */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 hidden w-full max-w-[55%] md:block md:w-[45%] lg:w-[40%] bg-[url('/brand-ref.png')] bg-cover bg-right bg-no-repeat"
            style={{ backgroundBlendMode: "screen" }}
          />
          {/* Legibility gradient */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.15) 100%)",
            }}
          />
          <div className="relative z-10 flex min-h-[380px] items-center px-8 text-center md:px-16 md:text-left">
            <div className="max-w-xl">
              <h1 className="text-[2.2rem] font-extrabold leading-tight md:text-[3.2rem]">
                <span className="block text-white">Become Our</span>
                <span className="block text-[#F01B24]">Authorized Dealer!</span>
              </h1>
              <p className="mt-4 text-xl font-medium leading-snug text-white md:text-[1.25rem]">
                {HERO_SUB}
              </p>
              <DealerApplyCta />
            </div>
          </div>
        </section>

        {/* Block 2 — Two-column body */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[42%_58%]">
          {/* Left — Why Become a Dealer? */}
          <div className="rounded-[16px] border border-[#ECEEF2] bg-white p-10 shadow-[0_2px_12px_rgba(16,24,40,0.04)]">
            <h2 className="text-2xl font-bold text-[#111827]">
              Why Become a <span className="text-[#F01B24]">Dealer?</span>
            </h2>
            <span className="mt-[10px] block h-1 w-14 rounded bg-[#F01B24]" aria-hidden="true" />
            <ul className="mt-8 space-y-7">
              {why.map((b) => {
                const Icon = benefitIcon(b.icon);
                return (
                  <li key={b.id} className="flex items-start gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#F01B24]">
                      <Icon className="h-7 w-7 text-white" aria-hidden="true" />
                    </span>
                    <div className="pt-1">
                      <h3 className="text-[1.05rem] font-bold text-[#111827]">{b.title}</h3>
                      <p className="mt-0.5 text-[0.95rem] leading-snug text-[#4A5568]">{b.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right — Registration form card */}
          <div
            id="dealer-registration-form"
            className="scroll-mt-6 rounded-[16px] border border-[#ECEEF2] bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.04)] md:p-10"
          >
            <h2 className="text-2xl font-bold text-[#111827]">
              Dealer <span className="text-[#F01B24]">Registration</span> Form
            </h2>
            <div className="mt-6">
              <DealerRegistrationForm packages={packages as SellPackageOption[]} />
            </div>
          </div>
        </section>

        {/* Block 3 — What Our Dealers Get */}
        <section
          aria-label="What our dealers get"
          className="rounded-[16px] border border-[#ECEEF2] bg-white p-10 shadow-[0_2px_12px_rgba(16,24,40,0.04)]"
        >
          <h2 className="text-2xl font-bold text-[#111827]">
            What Our <span className="text-[#F01B24]">Dealers</span> Get
          </h2>
          <span className="mt-[10px] block h-1 w-14 rounded bg-[#F01B24]" aria-hidden="true" />
          <div className="mt-8 grid grid-cols-1 gap-6 divide-y divide-[#ECEEF2] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-y-0">
            {get.map((b, index) => {
              const Icon = benefitIcon(b.icon);
              return (
                <div
                  key={b.id}
                  className={`flex flex-col items-center gap-3 text-center lg:px-6 ${
                    index > 0 ? "lg:border-l lg:border-[#ECEEF2]" : ""
                  }`}
                >
                  <Icon className="h-[42px] w-[42px] fill-[#FDEEF0] text-[#F01B24]" aria-hidden="true" strokeWidth={1.5} />
                  <h3 className="text-base font-bold text-[#1B2A4E]">{b.title}</h3>
                  <p className="text-[0.9rem] leading-relaxed text-[#4A5568]">{b.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}