import { z } from "zod";

const phone = z
  .string()
  .regex(/^(\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number (e.g. 01712345678)");

const email = z
  .string()
  .email("Enter a valid email address, for example you@example.com")
  .max(190, "That email address is too long to be accepted.");

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address to sign in.")
    .email("Enter a valid email address, for example you@example.com"),
  password: z
    .string()
    .min(1, "Enter your password to sign in.")
    .min(6, "Your password must be at least 6 characters long."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Enter your full name.")
      .max(80, "Your name must be 80 characters or fewer."),
    email,
    phone: phone.optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Choose a password of at least 8 characters.")
      .max(128, "Your password must be 128 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords do not match. Retype them and try again.",
  });

export const newsletterSchema = z.object({ email });

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Please enter your name so we know who we are replying to.")
    .max(80, "Your name must be 80 characters or fewer."),
  email,
  phone: phone.optional().or(z.literal("")),
  subject: z
    .string()
    .min(2, "Please tell us what your message is about.")
    .max(150, "The subject must be 150 characters or fewer."),
  message: z
    .string()
    .min(10, "Please write at least 10 characters so we can help properly.")
    .max(2000, "Your message must be 2000 characters or fewer."),
});

export const dealerApplicationSchema = z.object({
  phone: z
    .string()
    .regex(
      /^(?:\+?88)?01[3-9]\d{8}$/,
      "Enter a valid Bangladeshi mobile number, for example 01712345678."
    ),
  businessLoc: z
    .string()
    .min(10, "Please describe your business location in a little more detail (at least 10 characters).")
    .max(500, "The business location must be 500 characters or fewer."),
  packageId: z.string().cuid("Please choose a sell package from the list."),
  monthlyDemand: z.enum(["D_50_100", "D_101_300", "D_301_500", "D_501_1000", "D_1000_PLUS"], {
    errorMap: () => ({ message: "Please choose your expected monthly purchase volume." }),
  }),
  nidKeys: z
    .array(z.string().min(1))
    .min(2, "Please upload your NID front, NID back and a face photo.")
    .max(3, "Please upload no more than 3 NID photos."),
  locationKeys: z
    .array(z.string().min(1))
    .min(1, "Please upload at least one document of your business location.")
    .max(2, "Please upload no more than 2 business location documents."),
  consent: z.boolean().refine((v) => v, "Please confirm the uploaded documents belong to you."),
});

export const dealerUploadSchema = z.object({
  key: z.string().min(1, "No file was received. Please choose a file and try again."),
});

export const reviewSchema = z.object({
  productId: z.string().min(1, "Please reload the page and try again."),
  rating: z.coerce
    .number({ invalid_type_error: "Please choose a rating between 1 and 5 stars." })
    .int("Please choose a whole number of stars between 1 and 5.")
    .min(1, "Please choose a rating between 1 and 5 stars.")
    .max(5, "Please choose a rating between 1 and 5 stars."),
  body: z
    .string()
    .min(10, "Your review must be at least 10 characters long.")
    .max(1000, "Your review must be 1000 characters or fewer."),
});

export const reviewParamsSchema = z.object({
  productId: z.string().min(1, "Please reload the page and try again."),
  rating: z.coerce
    .number({ invalid_type_error: "Please choose a rating between 1 and 5 stars." })
    .int("Please choose a whole number of stars between 1 and 5.")
    .min(1, "Please choose a rating between 1 and 5 stars.")
    .max(5, "Please choose a rating between 1 and 5 stars."),
  body: z
    .string()
    .min(10, "Your review must be at least 10 characters long.")
    .max(1000, "Your review must be 1000 characters or fewer."),
  name: z.string().min(1, "Please enter your name so other customers know who wrote this review.").optional(),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1, "That product could not be found. Please reload the page and try again."),
  variantId: z.string().min(1, "Please choose a size and colour for this item."),
  quantity: z.coerce
    .number({ invalid_type_error: "Please enter a quantity between 1 and 20." })
    .int("Please enter a whole number for the quantity.")
    .min(1, "Please enter a quantity of at least 1.")
    .max(20, "You can order at most 20 of each item per order."),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number({ invalid_type_error: "Please enter a quantity between 1 and 20." })
    .int("Please enter a whole number for the quantity.")
    .min(1, "Please enter a quantity of at least 1.")
    .max(20, "You can order at most 20 of each item per order."),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1, "That product could not be found. Please reload the page and try again."),
});

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please enter the full name for delivery.")
    .max(80, "The full name must be 80 characters or fewer."),
  email,
  phone,
  district: z.string().min(1, "Please select your district from the list."),
  city: z
    .string()
    .max(80, "The city name must be 80 characters or fewer.")
    .optional()
    .or(z.literal("")),
  thana: z
    .string()
    .min(2, "Please enter your thana or upazila.")
    .max(80, "The thana name must be 80 characters or fewer."),
  area: z
    .string()
    .max(80, "The area name must be 80 characters or fewer.")
    .optional()
    .or(z.literal("")),
  addressLine: z
    .string()
    .min(5, "Please enter your full street address so we can deliver to you.")
    .max(250, "The address must be 250 characters or fewer."),
  postalCode: z
    .string()
    .max(20, "The postal code must be 20 characters or fewer.")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["COD", "BKASH", "NAGAD", "CARD"], {
    errorMap: () => ({ message: "Please choose a payment method." }),
  }),
  notes: z
    .string()
    .max(500, "Your note must be 500 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const orderItemInput = z.object({
  productId: z.string().min(1, "One of the items in your cart is no longer available."),
  variantId: z.string().min(1, "One of the items in your cart has an invalid size or colour."),
  quantity: z.coerce
    .number({ invalid_type_error: "Please enter a quantity between 1 and 20." })
    .int("Please enter a whole number for the quantity.")
    .min(1, "Please enter a quantity of at least 1.")
    .max(20, "You can order at most 20 of each item per order."),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemInput)
    .min(1, "Your cart is empty. Add at least one item before checking out."),
  address: checkoutSchema,
  saveAddress: z.boolean().optional(),
});

export const adminProductVariantInput = z.object({
  size: z
    .string()
    .min(1, "Enter a size, for example M, L or XL.")
    .max(20, "The size must be 20 characters or fewer."),
  colourName: z
    .string()
    .min(1, "Enter the colour name, for example Navy Blue.")
    .max(40, "The colour name must be 40 characters or fewer."),
  colourHex: z
    .string()
    .min(1, "Pick a colour so the swatch can be shown.")
    .max(20, "The colour hex must be 20 characters or fewer."),
  stock: z.coerce
    .number({ invalid_type_error: "Enter the stock quantity as a whole number." })
    .int("The stock quantity must be a whole number.")
    .min(0, "Stock cannot be negative. Enter zero or more.")
    .max(100000, "Stock cannot be more than 100000."),
});

export const adminProductImageInput = z.object({
  url: z.string().url("The image address is not a valid URL."),
  // Optional because legacy rows predate Cloudinary and hold remote URLs
  // (Unsplash) that we do not host and therefore cannot destroy.
  storageKey: z.string().min(1).max(200).optional(),
  alt: z.string().max(200, "The alt text must be 200 characters or fewer.").optional(),
  colour: z.string().max(40, "The colour must be 40 characters or fewer.").optional(),
  sortOrder: z.number().int().min(0).max(50).optional(),
});

export const adminProductSchema = z.object({
  name: z
    .string()
    .min(2, "Enter a product name of at least 2 characters.")
    .max(150, "The product name must be 150 characters or fewer."),
  slug: z
    .string()
    .min(2, "Enter a URL slug of at least 2 characters.")
    .max(150, "The slug must be 150 characters or fewer."),
  sku: z
    .string()
    .min(2, "Enter a SKU of at least 2 characters.")
    .max(60, "The SKU must be 60 characters or fewer."),
  description: z
    .string()
    .min(10, "Write a description of at least 10 characters.")
    .max(3000, "The description must be 3000 characters or fewer."),
  material: z.string().max(200, "The material must be 200 characters or fewer."),
  price: z.coerce
    .number({ invalid_type_error: "Enter the price as a number." })
    .positive("The price must be greater than zero."),
  compareAtPrice: z.coerce
    .number()
    .positive("The compare-at price must be greater than zero.")
    .optional()
    .or(z.literal("")),
  categoryId: z.string().min(1, "Choose a category for this product."),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"], {
    errorMap: () => ({ message: "Choose a department for this product." }),
  }),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  variants: z
    .array(adminProductVariantInput)
    .max(80, "A product can have at most 80 size/colour options.")
    .optional(),
  images: z
    .array(adminProductImageInput)
    .max(10, "A product can have at most 10 images.")
    .optional(),
});

export const adminProductUpdateSchema = adminProductSchema.partial();

export const adminVariantStockSchema = z
  .object({
    stock: z.coerce
      .number()
      .int("The stock quantity must be a whole number.")
      .min(0, "Stock cannot be negative. Enter zero or more.")
      .max(100000, "Stock cannot be more than 100000.")
      .optional(),
    delta: z.coerce
      .number()
      .int("The stock change must be a whole number.")
      .min(-10000, "The stock change cannot be less than -10000.")
      .max(10000, "The stock change cannot be more than 10000.")
      .optional(),
  })
  .refine((d) => (d.stock === undefined) !== (d.delta === undefined), {
    message: "Enter either a new stock total or a change in stock, but not both.",
  });

export const adminReviewStatusSchema = z.object({
  isApproved: z.boolean(),
});

export const adminDealerStatusSchema = z.object({
  status: z.enum(["PENDING", "DOCS_REVIEW", "VERIFIED", "APPROVED", "REJECTED"]),
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