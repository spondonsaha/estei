export type NavItem = {
  label: string;
  href: string;
};

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  avgRating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  image: string;
  specificColours: { name: string; hex: string }[];
  inWishlist: boolean;
};

export type ApiResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CartLine = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  slug: string;
  image: string;
  size: string;
  colourName: string;
  colourHex: string;
  unitPrice: string;
  quantity: number;
  stock: number;
};

export type CartView = {
  lines: CartLine[];
  subtotal: string;
  count: number;
};