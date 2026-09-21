import type { NavItem } from "@/lib/types";

export const SITE_NAME = "ESTEI";
export const SITE_TAGLINE = "Step Forward";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SUPPORT_PHONE = "+880 1700000000";

export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Men's", href: "/category/mens" },
  { label: "Women's", href: "/category/womens" },
  { label: "Casual", href: "/category/casual" },
  { label: "Formal", href: "/category/formal" },
  { label: "Sports", href: "/category/sports" },
  { label: "New Arrival", href: "/category/new-arrival" },
  { label: "Best Sellers", href: "/category/best-sellers" },
];

export const NAV_LINKS: NavItem[] = PRIMARY_NAV;

export const CATEGORY_SLUGS = [
  { slug: "mens", label: "Men's" },
  { slug: "womens", label: "Women's" },
  { slug: "casual", label: "Casual" },
  { slug: "formal", label: "Formal" },
  { slug: "sports", label: "Sports" },
  { slug: "new-arrival", label: "New Arrival" },
  { slug: "best-sellers", label: "Best Sellers" },
];

export const COLOUR_SWATCHES: { name: string; hex: string }[] = [
  { name: "Black", hex: "#0D0D0D" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Brown", hex: "#6B4226" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Gray", hex: "#8A8A8A" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Dark Red", hex: "#7A1C1C" },
  { name: "Maroon", hex: "#800000" },
  { name: "Red", hex: "#E01E26" },
  { name: "Pink", hex: "#F7B6C1" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Blue", hex: "#1E56A0" },
];

export const MEN_SIZE_SET = ["39", "40", "41", "42", "43", "44", "45"];
export const WOMEN_SIZE_SET = ["36", "37", "38", "39", "40"];

export const PRICE_RANGES = [
  { id: "0-2000", label: "৳0 – 2,000", min: 0, max: 2000 },
  { id: "2001-4000", label: "৳2,001 – 4,000", min: 2001, max: 4000 },
  { id: "4001-6000", label: "৳4,001 – 6,000", min: 4001, max: 6000 },
  { id: "6001+", label: "৳6,001+", min: 6001, max: null },
];

export const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "newest", label: "Newest" },
  { id: "rating", label: "Top Rated" },
];

export const BUSINESS_TYPES = [
  { value: "RETAIL_SHOP", label: "Retail Shop" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "ONLINE_SELLER", label: "Online Seller" },
  { value: "SHOWROOM", label: "Showroom" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "OTHER", label: "Other" },
];

export const IN_STOCK_ANIMATION = "fa-spin";

export const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80";