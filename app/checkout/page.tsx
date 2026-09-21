import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your ESTEI order with nationwide delivery and cash on delivery.",
};

export default function CheckoutPage() {
  return (
    <div className="section-estei">
      <div className="container-estei">
        <h1 className="mb-8 text-3xl font-bold text-estei-gray-900">Checkout</h1>
        <CheckoutForm />
      </div>
    </div>
  );
}