import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { SUPPORT_PHONE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the ESTEI team — we respond within 24 hours.",
};

export default function ContactPage() {
  return (
    <div className="section-estei">
      <div className="container-estei">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-estei-gray-900">Contact Us</h1>
          <p className="mt-2 text-estei-gray-600">We&apos;d love to hear from you.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            {[
              { icon: Phone, title: "Call us", text: SUPPORT_PHONE, sub: "Sat–Thu, 9am–9pm" },
              { icon: Mail, title: "Email us", text: "support@estei.com.bd", sub: "We reply within 24 hours" },
              { icon: MapPin, title: "Visit us", text: "ESTEI Head Office", sub: "Dhaka, Bangladesh" },
            ].map(({ icon: Icon, title, text, sub }) => (
              <div key={title} className="flex items-start gap-3 rounded-lg border border-estei-gray-200 bg-white p-5 shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-estei-red-tint text-estei-red">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-estei-gray-900">{title}</p>
                  <p className="text-sm text-estei-gray-600">{text}</p>
                  <p className="text-xs text-estei-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card lg:col-span-2">
            <h2 className="mb-5 text-lg font-bold text-estei-gray-900">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}