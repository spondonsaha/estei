import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info/info-page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "How do I place an order?",
    a: "Browse the shop, select a product, choose your size and colour, then add it to the cart. At checkout, enter your delivery details and choose Cash on Delivery or another payment method.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Cash on Delivery (COD), bKash, Nagad and Card payment. COD is available across all districts.",
  },
  {
    q: "How long does delivery take?",
    a: "Inside Dhaka: 1–2 working days. Outside Dhaka: 2–3 working days. All deliveries are made through national courier partners.",
  },
  {
    q: "Do you deliver outside Dhaka?",
    a: "Yes, we deliver to all 64 districts of Bangladesh, including remote areas.",
  },
  {
    q: "What is your return policy?",
    a: "You can return or exchange within 7 days of delivery as long as the item is unworn and in original packaging. See our Return & Exchange Policy for details.",
  },
  {
    q: "How do I know my size?",
    a: "Each product page has a Size Chart tab with EU size, UK size and foot length in centimetres. Measure your foot and match it to the chart.",
  },
  {
    q: "How do I become a dealer?",
    a: "Visit the Become a Dealer page, fill in the registration form and our team will contact you within 24 hours.",
  },
  {
    q: "How can I contact support?",
    a: "Email support@estei.com.bd, call +880 1700000000, or use the Contact Us page. We usually reply within 24 hours.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage title="Frequently Asked Questions" subtitle="Answers to common questions about shopping with ESTEI.">
      <Accordion type="single" collapsible>
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="text-sm text-estei-gray-600">
        Still have questions?{" "}
        <Link href="/contact" className="font-semibold text-estei-red hover:underline">
          Contact us →
        </Link>
      </p>
    </InfoPage>
  );
}