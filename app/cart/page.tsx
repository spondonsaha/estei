import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the items in your ESTEI cart.",
};

export default function CartPage() {
  return (
    <div className="section-estei">
      <div className="container-estei">
        <h1 className="mb-8 text-3xl font-bold text-estei-gray-900">Shopping Cart</h1>
        <CartView />
      </div>
    </div>
  );
}