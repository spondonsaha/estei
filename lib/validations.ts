import { z } from "zod";

const phone = z
  .string()
  .regex(/^(\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number (e.g. 01712345678)");

const email = z.string().email("Enter a valid email address").max(190);

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    email,
    phone: phone.optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const newsletterSchema = z.object({ email });

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  email,
  phone: phone.optional().or(z.literal("")),
  subject: z.string().min(2, "Subject is required").max(150),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export const dealerSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(80),
  mobile: phone,
  email: email.optional().or(z.literal("")),
  businessName: z.string().min(2, "Business name is required").max(120),
  district: z.string().min(1, "Select a district"),
  businessType: z.enum([
    "RETAIL_SHOP",
    "WHOLESALE",
    "ONLINE_SELLER",
    "SHOWROOM",
    "DISTRIBUTOR",
    "OTHER",
  ]),
  address: z.string().max(250).optional().or(z.literal("")),
  yearsInBiz: z.coerce.number().int().min(0).max(100).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters").max(1000),
});

export const reviewParamsSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters").max(1000),
  name: z.string().min(1).optional(),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1),
});

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(80),
  phone: phone,
  district: z.string().min(1, "Select a district"),
  city: z.string().min(2, "City is required").max(80),
  area: z.string().max(80).optional().or(z.literal("")),
  addressLine: z.string().min(5, "Address is required").max(250),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  paymentMethod: z.enum(["COD", "BKASH", "NAGAD", "CARD"]),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const orderItemInput = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInput).min(1, "Cart is empty"),
  address: checkoutSchema,
  saveAddress: z.boolean().optional(),
});

export const adminProductSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(150),
  sku: z.string().min(2).max(60),
  description: z.string().min(10).max(3000),
  material: z.string().max(200),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal("")),
  categoryId: z.string().min(1),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const adminReviewStatusSchema = z.object({
  isApproved: z.boolean(),
});

export const adminDealerStatusSchema = z.object({
  status: z.enum(["PENDING", "REVIEWING", "APPROVED", "REJECTED"]),
  adminNote: z.string().max(500).optional().or(z.literal("")),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ]),
});

export const adminNewsletterSchema = z.object({
  email: email,
});