import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info/info-page";

export const metadata: Metadata = { title: "Return & Exchange Policy" };

export default function ReturnPolicyPage() {
  return (
    <InfoPage title="Return & Exchange Policy">
      <InfoSection title="7-day easy return">
        <p>You can request a return or exchange within 7 days of delivery for any valid reason.</p>
      </InfoSection>
      <InfoSection title="Conditions">
        <p>The item must be unused, unworn and in its original packaging with all tags attached.</p>
        <p>Damaged, defective or &quot;wrong item&quot; deliveries qualify for replacement or refund at no extra cost.</p>
        <p>For hygiene reasons, returns apply only to unworn shoes in resellable condition.</p>
      </InfoSection>
      <InfoSection title="How to return">
        <p>Contact our support team at support@estei.com.bd or +880 1700000000 with your order number.</p>
        <p>Our team will arrange a pickup or give you a return address. Delivery fees for genuine returns are covered by ESTEI.</p>
      </InfoSection>
      <InfoSection title="Refunds">
        <p>Refunds for prepaid orders are processed within 5–7 working days to your original payment method.</p>
      </InfoSection>
    </InfoPage>
  );
}