import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info/info-page";

export const metadata: Metadata = { title: "Delivery Information" };

export default function DeliveryInformationPage() {
  return (
    <InfoPage title="Delivery Information">
      <InfoSection title="How fast is delivery?">
        <p>ESTEI delivers across all 64 districts of Bangladesh. Standard delivery takes 2–3 working days.</p>
        <p>Inside Dhaka: 1–2 working days. Outside Dhaka: 2–3 working days.</p>
      </InfoSection>
      <InfoSection title="Shipping charges">
        <p>Inside Dhaka: ৳80 flat rate delivery charge.</p>
        <p>Outside Dhaka: ৳120 flat rate delivery charge.</p>
        <p>Free delivery promotions are announced from time to time — check the homepage and newsletter.</p>
      </InfoSection>
      <InfoSection title="Tracking your order">
        <p>After your order is confirmed, you will receive your order number. Our support team can update you on the delivery progress via phone or WhatsApp.</p>
      </InfoSection>
      <InfoSection title="Delivery areas">
        <p>We deliver to any address within Bangladesh, including remote and rural thanas, through our national courier partners.</p>
      </InfoSection>
    </InfoPage>
  );
}