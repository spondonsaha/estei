import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info/info-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <InfoPage title="Privacy Policy">
      <InfoSection title="Information we collect">
        <p>We collect information you provide directly: name, email, phone number, delivery address and order history. We also collect limited technical data (session identifiers) to keep your cart working.</p>
      </InfoSection>
      <InfoSection title="How we use your information">
        <p>To process and deliver your orders, provide customer support, send order updates, and — only with your consent — marketing emails such as our newsletter.</p>
      </InfoSection>
      <InfoSection title="Data security">
        <p>Passwords are hashed with bcrypt and never stored in plain text. Your data is stored on secured servers (Neon Postgres) with SSL connections.</p>
      </InfoSection>
      <InfoSection title="Sharing">
        <p>We do not sell your personal data. We share only the minimum information required with our delivery partners and payment processors to fulfil your order.</p>
      </InfoSection>
      <InfoSection title="Your rights">
        <p>You may request a copy, correction or deletion of your personal data at any time by contacting support@estei.com.bd. We respond within 30 days.</p>
      </InfoSection>
    </InfoPage>
  );
}