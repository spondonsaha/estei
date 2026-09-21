import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info/info-page";

export const metadata: Metadata = { title: "Cash on Delivery (COD) Information" };

export default function CodInformationPage() {
  return (
    <InfoPage title="Cash on Delivery (COD)">
      <InfoSection title="What is COD?">
        <p>Cash on Delivery lets you pay in cash when your order arrives at your door. No advance payment is required.</p>
      </InfoSection>
      <InfoSection title="Where is COD available?">
        <p>COD is available across all districts of Bangladesh through our courier partners.</p>
      </InfoSection>
      <InfoSection title="COD tips">
        <p>Have the exact amount ready to speed up delivery.</p>
        <p>Inspect your parcel before paying. If the seal is broken or the parcel is damaged, refuse it and contact us.</p>
        <p>Our courier partners never ask for any payment other than the order total shown at checkout.</p>
      </InfoSection>
    </InfoPage>
  );
}