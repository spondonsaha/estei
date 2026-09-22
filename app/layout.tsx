import type { Metadata, Viewport } from "next";
import { Caveat, Inter, Noto_Sans_Bengali, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/components/cart/cart-context";
import { SITE_URL } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ESTEI — Premium Footwear for Every Journey",
    template: "%s | ESTEI",
  },
  description:
    "ESTEI is a Bangladeshi footwear manufacturer selling direct to consumers — factory direct pricing, premium quality, nationwide delivery and easy returns.",
  keywords: ["ESTEI", "footwear", "shoes", "Bangladesh", "factory direct", "ecommerce"],
  openGraph: {
    type: "website",
    siteName: "ESTEI",
    title: "ESTEI — Premium Footwear for Every Journey",
    description: "Step into better days with ESTEI. Factory direct footwear for every journey.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ESTEI — Premium Footwear for Every Journey",
    description: "Step into better days with ESTEI.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${caveat.variable} ${notoBengali.variable} font-sans antialiased`}
        style={
          {
            "--font-sans": "var(--font-inter), var(--font-noto-bengali), ui-sans-serif, system-ui, sans-serif",
            "--font-display": "var(--font-poppins), var(--font-noto-bengali), ui-sans-serif, system-ui, sans-serif",
            "--font-script": "var(--font-caveat), cursive",
          } as React.CSSProperties
        }
      >
        <Providers>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </CartProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}