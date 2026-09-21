export type ProductDetailVariant = {
  id: string;
  size: string;
  colourName: string;
  colourHex: string;
  stock: number;
};

export type ProductDetailImage = {
  url: string;
  alt: string | null;
  colour: string | null;
};

export type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type RelatedProduct = {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  avgRating: number;
  reviewCount: number;
  image: string;
  inWishlist: boolean;
};

export type ProductDetailData = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  material: string;
  price: string;
  compareAtPrice: string | null;
  avgRating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  category: { slug: string; name: string };
  images: ProductDetailImage[];
  variants: ProductDetailVariant[];
  reviews: ReviewItem[];
  ratingDistribution: number[];
  inWishlist: boolean;
  related: RelatedProduct[];
};