import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info/info-page";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsConditionsPage() {
  return (
    <InfoPage title="Terms & Conditions">
      <InfoSection title="General">
        <p>By using the ESTEI website you agree to these terms. ESTEI reserves the right to update these terms at any time; continued use of the site constitutes acceptance.</p>
      </InfoSection>
      <InfoSection title="Products & pricing">
        <p>All prices are listed in Bangladeshi Taka (৳) and include applicable discounts shown at the time of purchase. Product images are for illustration and may differ slightly from the delivered item.</p>
      </InfoSection>
      <InfoSection title="Orders">
        <p>An order is confirmed once we send you an order number. We may cancel orders that appear fraudulent or where stock is unavailable, with a full refund where applicable.</p>
      </InfoSection>
      <InfoSection title="Returns">
        <p>Returns and exchanges follow our Return & Exchange Policy. Shoes must be unworn and in original packaging within 7 days of delivery.</p>
      </InfoSection>
      <InfoSection title="Limitation of liability">
        <p>ESTEI is not liable for indirect or consequential damages arising from the use of this website, to the maximum extent permitted by law.</p>
      </InfoSection>
    </InfoPage>
  );
}