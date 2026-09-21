# BUILD PROMPT — ESTEI Footwear E-Commerce Website (Full Stack + Neon Postgres)

> Copy everything below this line into your coding agent (Claude Code, Cursor, v0, Bolt, Lovable, etc.). It is written as a single self-contained instruction set.

---

## 1. PROJECT BRIEF

Build a complete, production-ready e-commerce website for **ESTEI**, a Bangladeshi footwear manufacturer that sells direct-to-consumer and recruits wholesale dealers. The site must include a working backend and a PostgreSQL database hosted on **Neon**.

Do not build a static mockup. Every product grid, product detail page, review block, and form must read from and write to the database.

---

## 2. TECH STACK (use exactly this)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| UI primitives | shadcn/ui (Button, Input, Select, Checkbox, Dialog, Tabs, Accordion, Toast) |
| Icons | lucide-react |
| ORM | Prisma |
| Database | PostgreSQL on Neon (serverless) |
| DB driver | `@neondatabase/serverless` with Prisma adapter, or standard Prisma over the pooled Neon connection string |
| Validation | Zod on both client and server |
| Forms | react-hook-form + zodResolver |
| Auth (admin + customer) | NextAuth v5 (Credentials provider) with bcrypt-hashed passwords, JWT sessions |
| Image handling | next/image, remote patterns allowed for Unsplash/Cloudinary placeholders |
| State (cart) | React Context + localStorage persistence, synced to DB when logged in |
| Deployment target | Vercel |

Use Server Components for data fetching and Server Actions or Route Handlers for mutations. No client-side database access.

---

## 3. DESIGN SYSTEM — APPLY TO EVERY PAGE

The brand is **black + signal red + white** with light gray section backgrounds. This palette is non-negotiable and must be identical on every page.

### 3.1 Colour tokens

Define these in `globals.css` as CSS variables and map them in Tailwind:

```css
--estei-red:        #E01E26;  /* primary CTA, prices, active states, logo mark */
--estei-red-hover:  #B8181F;
--estei-black:      #0D0D0D;  /* header, footer, dark banners */
--estei-charcoal:   #1A1A1A;  /* dark card surfaces */
--estei-gray-900:   #222222;  /* headings on light bg */
--estei-gray-600:   #5A5A5A;  /* body text */
--estei-gray-400:   #9A9A9A;  /* muted / meta text */
--estei-gray-200:   #E5E5E5;  /* borders, dividers */
--estei-gray-100:   #F5F5F5;  /* section background, filter panel, input fill */
--estei-white:      #FFFFFF;
--estei-star:       #F5A623;  /* rating stars and rating bars */
--estei-success:    #1E9E5A;  /* "in stock" / confirmation only */
```

### 3.2 Typography

- Headings: **Poppins** (600/700), tight tracking, uppercase for hero headlines.
- Body/UI: **Inter** (400/500).
- Hero accent script ("Comfort Style Durability" overlay): a handwriting face such as **Caveat** or **Dancing Script**, white, rotated slightly, semi-transparent.
- Bengali currency symbol **৳** must render correctly everywhere — include `Noto Sans Bengali` as a fallback in the font stack.

Scale: hero h1 `clamp(2.5rem, 6vw, 4.5rem)`; section title 2rem centred; product card title 0.95rem/600; price 1.05rem/700 in red.

### 3.3 Component rules

- **Buttons (primary):** solid `--estei-red`, white text, `border-radius: 6px`, padding `12px 26px`, font-weight 600, right-pointing arrow `→` appended on CTA buttons ("Shop Now →", "Apply Now →", "Shop Best Sellers →"). Hover darkens to `--estei-red-hover` and lifts 1px.
- **Buttons (secondary):** transparent with 1px white border on dark surfaces; 1px gray-200 border on light surfaces.
- **Cards:** white, `border-radius: 10px`, 1px `--estei-gray-200` border, shadow `0 2px 10px rgba(0,0,0,.05)`, hover raises shadow and scales the image 1.04.
- **Pills/tabs:** rounded-full, inactive = white with gray border, active = light red tint background `#FDECED` with red text and red border.
- **Section spacing:** 72px vertical padding desktop, 44px mobile.
- **Grid:** max-width 1280px, 24px gutters.
- Fully responsive: 4-col → 2-col → 1-col. Filter sidebar collapses into a bottom-sheet "Filters" drawer under 1024px. Header nav collapses into a hamburger drawer under 900px.

---

## 4. GLOBAL LAYOUT

### 4.1 Header (sticky, white, 1px bottom border)

- Left: ESTEI logo — red leaping-horse mark + black "ESTEI" wordmark (render as an inline SVG component so it scales).
- Centre nav: `Home · Men's · Women's · Casual · Formal · Sports · New Arrival · Best Sellers`. Active link is red with a 2px red underline.
- Right icons: Search (opens an overlay search that queries products by name), Account (login/register dropdown), Cart (bag icon with a red badge showing item count).

### 4.2 Footer (black background, white text)

- Column 1: ESTEI logo (white wordmark, red mark) + tagline "Step Forward".
- Column 2 — **Quick Links:** Home, Men's, Women's, Casual, Formal, Sports, New Arrival, Best Sellers, Become a Dealer!
- Column 3 — **Customer Care:** Delivery Information, COD Information, Return & Exchange Policy, FAQ, Contact Us.
- Column 4 — **Follow Us:** circular icon buttons for Facebook, Instagram, YouTube, TikTok. Below it: "Subscribe to our newsletter" / "Get the latest updates, offers and more." + email input with a red square arrow submit button (POSTs to `/api/newsletter`, stores in DB, dedupes on email).
- Bottom bar (thin, gray-400 text): "© 2025 ESTEI. All rights reserved." left; "Privacy Policy · Terms & Conditions" right.

---

## 5. PAGE-BY-PAGE SPECIFICATION

### 5.1 HOME — `/`

Sections in this exact order:

1. **Hero slider** — full-bleed, ~560px tall, dark photographic background of a black/red running shoe on a person. Left-aligned copy: `STEP INTO` (white) on line 1, `BETTER DAYS` (red) on line 2, sub-line "Premium Footwear for Every Journey" (gray-200), then a red **Shop Now →** button. Script overlay on the right: "Comfort Style Durability". Circular chevron arrows `‹ ›` on both edges, auto-advance every 6s, 3 slides pulled from a `HeroSlide` table.
2. **Trust bar (4 items, light gray band, icon + two lines):** Factory Direct / Best Price · Premium Quality / Long Lasting · Fast Delivery / Across Bangladesh · Easy Return / Hassle Free.
3. **Shop by Category** — centred title "Shop by Category". Pill filter row: `Men's` (active) `Women's` `Casual` `Formal` `Sports`, with a red `View All →` on the right. Below it, 5 image cards in a row: Men's, Women's, Casual, Formal, Sports — each with a photo, a bottom label bar, and a `→` arrow. Clicking a card routes to `/category/[slug]`.
4. **Two promo banners side by side** — dark photo cards: "New Arrivals / Fresh styles. More comfort." with **Shop New →**, and "Best Sellers / Loved by thousands." with **Shop Best Sellers →**.
5. **Dealer CTA banner** — wide dark card, handshake photograph on the left half, right half headline "Become a Dealer!" + "Grow Your Business with ESTEI" (ESTEI in red) + four red check-circle bullets: Attractive Profit Margin, Factory Direct Supply, Marketing Support, Dedicated Dealer Support. Red **Apply Now →** button linking to `/dealer`.
6. **Second trust bar (4 items):** Made in Our Factory / Quality You Can Trust · Modern Designs / Trendy & Comfortable · Nationwide Delivery / Fast & Reliable · Dedicated Support / We're Here for You.
7. Footer.

### 5.2 CATEGORY / LISTING — `/category/[slug]` (mens, womens, casual, formal, sports, new-arrival, best-sellers)

1. **Category hero** — ~180px dark band with a shoe photo, headline (e.g. "Men's") and sub-line ("Built for Comfort. Designed for You." for men, "Elegance in Every Step." for women). Sub-lines come from the `Category` table.
2. **Breadcrumb:** `Home > Men's`.
3. **Two-column body.** Left sidebar (280px, light gray panel, `Filter` heading):
   - **Price Range** checkboxes: ৳0 – 2,000 · ৳2,001 – 4,000 · ৳4,001 – 6,000 · ৳6,001+
   - **Size** checkboxes: men 39–45; women 36–40 (sizes come from the category's size set)
   - **Colour** swatch grid (two rows of circles: black, navy, brown, olive, gray, silver / dark red, maroon, red, pink, tan, blue). Selected swatch gets a red ring.
   - **Sort by** select.
   All filters write to URL search params (`?price=&size=&colour=&sort=&page=`) and are executed **server-side in the Prisma query**, not in the browser.
4. **Right content:** "Showing 12 products" counter on the left, "Sort by: Featured" select on the right (Featured, Price: Low to High, Price: High to Low, Newest, Top Rated). Then a **3-column product grid**.
   - Product card: square image on a light gray tile, outline heart (wishlist) top-right that fills red when toggled, product name, price in red with ৳, star row + numeric rating in parentheses.
5. Pagination (12 per page), red active page number.
6. **Lifestyle banner** below the grid: dark photo band, "More Than Just Shoes / It's a Lifestyle" (with "a Lifestyle" in red) + **Shop Now →**.

### 5.3 PRODUCT DETAIL — `/product/[slug]`

1. Breadcrumb `Home > Men's > ESTEI Runner 01`.
2. **Gallery:** vertical thumbnail strip (5 thumbs) on the left, large main image on a light gray tile, red **-39%** discount badge top-left computed from `(1 - price/compareAtPrice)`.
3. **Buy box:** product title (1.6rem/700), star row + "4.8 (124 reviews)", price line — struck-through gray `৳3,100` then large red `৳2,499`.
   - **Available Colours:** circular swatches, selected gets a red ring.
   - **Size:** row of square size buttons 39–45; unavailable sizes are struck through and disabled; selected is filled black. A red **Size Chart** link opens the size-chart tab/modal.
   - Quantity stepper.
   - Full-width red **Add to Cart** button + square outline heart button beside it.
4. **Three info boxes in a row:** 🚚 Fast Delivery / 2–3 working days · 💵 Cash on Delivery / Available · ↩ 7 Days Return / Easy & Hassle Free.
5. **Tab bar** (active tab = red text + red underline): `Product Details · Size Chart · Material · Colour · Delivery Info · COD Info · Return Policy · Reviews`.
   - *Product Details* pane shows: **Material** ("Mesh Upper, EVA Sole"), **Available Colours** swatches, **Description** ("Lightweight, breathable and stylish. Perfect for daily wear, walking, and sports activities. Designed with comfort and durability in mind."), and on the right a **Size Chart (Men's)** table with columns `EU Size | UK Size | Foot Length (cm)` and rows: 39/6/24.5, 40/7/25.0, 41/8/25.5, 42/9/26.0, 43/10/26.5, 44/11/27.0, 45/12/27.5.
6. **Customer Reviews block:**
   - Left summary card: huge `4.8`, "out of 5", "Based on 124 reviews", then 5→1 star distribution rows each with a gold progress bar and a percentage (88%, 8%, 2%, 1%, 1%).
   - Right list: individual review cards — circular avatar, reviewer name (e.g. "Arif Hasan", "Nahid Islam"), relative time ("2 weeks ago", "1 month ago"), review body, gold star row. Paginated / "Load more".
   - Logged-in customers who purchased can submit a review; it posts to the DB and recomputes the product's average rating and count.
7. **"You May Also Like"** — 4 related products from the same category.

### 5.4 DEALER — `/dealer`

1. **Hero** — dark band with a red/black shoe photo: "Become Our Authorized Dealer!" + "Partner with ESTEI and grow your business with a trusted footwear manufacturer." + red **Apply Now →** that smooth-scrolls to the form.
2. **Two-column body.**
   - Left — **"Why Become a Dealer?"**, six rows, each a red circular icon + bold title + gray sub-line:
     - Factory Direct Supply — *Get products directly from our own factory.*
     - Competitive Dealer Price — *Better margin. Higher profit.*
     - Attractive Profit Margin — *More sales. More earnings.*
     - Regular New Designs — *Stay ahead with the latest styles.*
     - Marketing Support — *We'll support your growth.*
     - Dedicated Support — *Get help whenever you need.*
   - Right — **Dealer Registration Form** card:
     - `Full Name *` (text)
     - `Mobile Number *` (text, validate Bangladeshi format `^(\+?88)?01[3-9]\d{8}$`)
     - `Business Name *` (text)
     - `District` (select — all 64 Bangladesh districts, seeded in DB)
     - `Select Business Type` (select — Retail Shop, Wholesale, Online Seller, Showroom, Distributor, Other)
     - Optional: Email, Business Address, Years in Business, Message
     - Red full-width **Submit Application** button
     - Helper line under the form: "We'll get back to you within 24 hours." and a red phone row "+880 1700000000".
   - On submit: Zod-validate → insert a `DealerApplication` row with status `PENDING` → show a success toast and swap the card for a confirmation state with the application reference number. Handle duplicate mobile numbers gracefully. Rate-limit to 3 submissions per IP per hour.
3. **"What Our Customers Say"** — testimonial carousel, 3 cards visible, dot pagination. Cards: avatar, name, role, gold stars, quote. Seed with: Tania Akter / Fashion Blogger — *"Love the quality and comfort. ESTEI is now my go-to brand."*; Rafiq Ahmed / Regular Customer — *"Stylish, comfortable and durable. Highly recommended!"*; Mitu Rahman / College Student — *"Great design at an affordable price. Love it!"*

### 5.5 Additional pages to generate

`/cart`, `/checkout` (Cash on Delivery + district-based shipping fee), `/order/[id]` confirmation, `/account` (orders, wishlist, profile), `/login`, `/register`, `/search`, `/delivery-information`, `/cod-information`, `/return-exchange-policy`, `/faq`, `/contact`, `/privacy-policy`, `/terms-conditions`, and a `/admin` dashboard (products CRUD, orders, reviews moderation, dealer applications with Approve/Reject, newsletter export).

---

## 6. DATABASE — PRISMA SCHEMA FOR NEON

Create `prisma/schema.prisma` with the following models. Use `cuid()` ids, `@@index` on every foreign key and on all filterable/sortable columns (`categoryId`, `price`, `isNewArrival`, `isBestSeller`, `avgRating`, `createdAt`).

```prisma
generator client { provider = "prisma-client-js" }

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // Neon POOLED connection
  directUrl = env("DIRECT_URL")          // Neon DIRECT connection, for migrations
}

enum Gender            { MEN WOMEN UNISEX }
enum DealerStatus      { PENDING REVIEWING APPROVED REJECTED }
enum OrderStatus       { PENDING CONFIRMED PROCESSING SHIPPED DELIVERED CANCELLED RETURNED }
enum PaymentMethod     { COD BKASH NAGAD CARD }
enum PaymentStatus     { UNPAID PAID REFUNDED }
enum Role              { CUSTOMER ADMIN }
enum BusinessType      { RETAIL_SHOP WHOLESALE ONLINE_SELLER SHOWROOM DISTRIBUTOR OTHER }

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  phone         String?   @unique
  passwordHash  String
  role          Role      @default(CUSTOMER)
  addresses     Address[]
  orders        Order[]
  reviews       Review[]
  wishlist      WishlistItem[]
  cart          CartItem[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Address {
  id          String  @id @default(cuid())
  userId      String
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName    String
  phone       String
  district    String
  city        String
  area        String?
  addressLine String
  postalCode  String?
  isDefault   Boolean @default(false)
  orders      Order[]
  @@index([userId])
}

model Category {
  id           String    @id @default(cuid())
  name         String                       // "Men's", "Women's", "Casual", "Formal", "Sports"
  slug         String    @unique
  heroTitle    String                       // "Men's"
  heroSubtitle String                       // "Built for Comfort. Designed for You."
  heroImage    String
  cardImage    String
  gender       Gender    @default(UNISEX)
  sortOrder    Int       @default(0)
  isActive     Boolean   @default(true)
  products     Product[]
}

model Product {
  id              String   @id @default(cuid())
  name            String                     // "ESTEI Runner 01"
  slug            String   @unique
  sku             String   @unique
  description     String   @db.Text
  material        String                     // "Mesh Upper, EVA Sole"
  price           Decimal  @db.Decimal(10,2) // 2499.00
  compareAtPrice  Decimal? @db.Decimal(10,2) // 3100.00  -> drives the -39% badge
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id])
  gender          Gender
  isNewArrival    Boolean  @default(false)
  isBestSeller    Boolean  @default(false)
  isFeatured      Boolean  @default(false)
  isActive        Boolean  @default(true)
  avgRating       Float    @default(0)       // denormalised, recomputed on review write
  reviewCount     Int      @default(0)
  images          ProductImage[]
  variants        ProductVariant[]
  reviews         Review[]
  cartItems       CartItem[]
  wishlistItems   WishlistItem[]
  orderItems      OrderItem[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([categoryId]) @@index([price]) @@index([avgRating]) @@index([isNewArrival]) @@index([isBestSeller])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  alt       String?
  colour    String?          // ties a gallery image to a colour swatch
  sortOrder Int     @default(0)
  @@index([productId])
}

model ProductVariant {
  id         String  @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  size       String           // "39".."45" / "36".."40"
  colourName String           // "Black"
  colourHex  String           // "#0D0D0D"
  stock      Int     @default(0)
  sku        String  @unique
  @@unique([productId, size, colourName])
  @@index([productId])
}

model SizeChartRow {
  id         String  @id @default(cuid())
  chartName  String           // "Men's" | "Women's"
  euSize     String
  ukSize     String
  footLength Decimal @db.Decimal(4,1)   // cm
  sortOrder  Int     @default(0)
  @@index([chartName])
}

model Review {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  authorName String
  rating     Int                       // 1..5
  body       String   @db.Text
  isApproved Boolean  @default(true)
  createdAt  DateTime @default(now())
  @@index([productId]) @@index([userId])
}

model CartItem {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId String?                    // guest carts
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  variantId String
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  @@index([userId]) @@index([sessionId])
}

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, productId])
}

model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique      // "ESTEI-2026-000123"
  userId        String?
  user          User?         @relation(fields: [userId], references: [id])
  addressId     String?
  address       Address?      @relation(fields: [addressId], references: [id])
  guestName     String?
  guestPhone    String?
  guestAddress  String?
  district      String
  subtotal      Decimal       @db.Decimal(10,2)
  shippingFee   Decimal       @db.Decimal(10,2)
  discount      Decimal       @db.Decimal(10,2) @default(0)
  total         Decimal       @db.Decimal(10,2)
  status        OrderStatus   @default(PENDING)
  paymentMethod PaymentMethod @default(COD)
  paymentStatus PaymentStatus @default(UNPAID)
  notes         String?
  items         OrderItem[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  @@index([userId]) @@index([status])
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product @relation(fields: [productId], references: [id])
  productName String                       // snapshot
  size        String
  colourName  String
  unitPrice   Decimal @db.Decimal(10,2)    // snapshot
  quantity    Int
  @@index([orderId])
}

model DealerApplication {
  id            String       @id @default(cuid())
  refNumber     String       @unique       // "DLR-2026-0042"
  fullName      String
  mobile        String
  email         String?
  businessName  String
  district      String
  businessType  BusinessType
  address       String?
  yearsInBiz    Int?
  message       String?      @db.Text
  status        DealerStatus @default(PENDING)
  adminNote     String?      @db.Text
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  @@index([status]) @@index([mobile])
}

model District {
  id       String @id @default(cuid())
  name     String @unique
  division String
  shippingFee Decimal @db.Decimal(10,2) @default(120)
}

model HeroSlide {
  id        String  @id @default(cuid())
  titleTop  String            // "STEP INTO"
  titleRed  String            // "BETTER DAYS"
  subtitle  String            // "Premium Footwear for Every Journey"
  ctaLabel  String            // "Shop Now"
  ctaHref   String
  image     String
  sortOrder Int     @default(0)
  isActive  Boolean @default(true)
}

model Testimonial {
  id        String  @id @default(cuid())
  name      String
  role      String
  quote     String  @db.Text
  rating    Int     @default(5)
  avatar    String?
  isActive  Boolean @default(true)
  sortOrder Int     @default(0)
}

model NewsletterSubscriber {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  subject   String
  message   String   @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

---

## 7. NEON SETUP (include these exact instructions in the README)

1. Create a project at **neon.tech**, region Singapore (`ap-southeast-1`) for lowest latency to Bangladesh.
2. From the Neon dashboard → **Connection Details**, copy both the **pooled** and **direct** connection strings.
3. Create `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

4. Commands: `npx prisma generate` → `npx prisma migrate dev --name init` → `npx prisma db seed`.
5. Add a `prisma.seed` entry in `package.json` pointing at `prisma/seed.ts` (run with `tsx`).
6. Use a global singleton `PrismaClient` in `lib/prisma.ts` to survive Next.js hot reload.
7. `sslmode=require` is mandatory; migrations must run against `DIRECT_URL`, runtime queries against the pooled `DATABASE_URL`.

---

## 8. SEED DATA (exact values — match the design)

**Categories:** Men's (`mens`, "Built for Comfort. Designed for You."), Women's (`womens`, "Elegance in Every Step."), Casual, Formal, Sports.

**Men's products** — all `compareAtPrice` set so discounts land between 15% and 40%:

| Name | Slug | Price | Rating | Reviews |
|---|---|---|---|---|
| ESTEI Runner 01 | estei-runner-01 | ৳2,499 (was ৳3,100) | 4.8 | 124 |
| ESTEI Comfort 02 | estei-comfort-02 | ৳2,799 | 4.7 | 86 |
| ESTEI Formal 03 | estei-formal-03 | ৳3,499 | 4.6 | 51 |
| ESTEI Classic 04 | estei-classic-04 | ৳3,199 | 4.5 | 63 |
| ESTEI Sport 05 | estei-sport-05 | ৳2,899 | 4.8 | 97 |
| ESTEI Flex 06 | estei-flex-06 | ৳2,699 | 4.7 | 72 |

**Women's products:**

| Name | Slug | Price | Rating |
|---|---|---|---|
| ESTEI Belle 01 | estei-belle-01 | ৳2,499 | 4.8 |
| ESTEI Grace 02 | estei-grace-02 | ৳2,799 | 4.7 |
| ESTEI Trend 03 | estei-trend-03 | ৳3,199 | 4.6 |
| ESTEI Flow 04 | estei-flow-04 | ৳2,899 | 4.3 |
| ESTEI Fit 05 | estei-fit-05 | ৳2,699 | 4.8 |
| ESTEI Bloom 06 | estei-bloom-06 | ৳2,999 | 4.7 |

Expand each category to 12 products so the "Showing 12 products" counter is truthful. Every product gets 5 gallery images, 4–6 colour variants, and full size runs (men 39–45, women 36–40) with random stock 0–30 (leave at least one size out of stock per product to exercise the disabled state).

**Size charts:** seed `Men's` rows exactly as listed in §5.3; seed a `Women's` chart with EU 36–40 / UK 3–7 / 22.5–24.0 cm.

**Reviews:** seed 8–15 per product with Bangladeshi names (Arif Hasan, Nahid Islam, Tanvir Rahman, Sumaiya Akter, Mehedi Hasan, Farhana Yasmin…) and realistic bodies such as "Very comfortable and stylish. Perfect for daily use. Highly recommended!" and "Good quality product. Delivery was on time." Distribute ratings so ESTEI Runner 01 lands at 4.8 with the 88/8/2/1/1 split shown in the design.

**Districts:** all 64 Bangladesh districts with division, shipping fee ৳80 for Dhaka, ৳120 elsewhere.

**Hero slides:** 3, the first being "STEP INTO / BETTER DAYS / Premium Footwear for Every Journey".

**Testimonials:** the three listed in §5.4.

**Admin user:** `admin@example.com` / `REDACTED` (bcrypt hashed, role ADMIN).

---

## 9. API SURFACE (Route Handlers under `/app/api`)

```
GET    /api/products              ?category=&price=&size=&colour=&sort=&page=&q=
GET    /api/products/[slug]
GET    /api/categories
POST   /api/reviews               { productId, rating, body }  -> recompute avgRating + reviewCount in a transaction
GET    /api/cart                  POST /api/cart  PATCH /api/cart/[id]  DELETE /api/cart/[id]
POST   /api/wishlist/toggle
POST   /api/orders                -> creates order, decrements variant stock in a transaction, returns orderNumber
GET    /api/orders/[orderNumber]
POST   /api/dealer/apply          -> Zod-validated, rate-limited, returns refNumber
POST   /api/newsletter
POST   /api/contact
GET    /api/districts
/api/admin/*                      -> all guarded by role === 'ADMIN'
```

Rules: validate every input with Zod, return typed JSON `{ ok, data } | { ok:false, error }`, never leak Prisma errors to the client, wrap stock decrement + order creation in `prisma.$transaction`, and prevent overselling with a stock check inside the transaction.

---

## 10. QUALITY BAR

- TypeScript strict mode, zero `any`.
- All images use `next/image` with explicit sizes and `priority` on the hero.
- Loading skeletons for product grids (`loading.tsx`), error boundaries (`error.tsx`), and a branded `not-found.tsx`.
- SEO: per-page `generateMetadata`, Open Graph images, JSON-LD `Product` schema with price, currency `BDT`, rating and review count; `sitemap.ts` and `robots.ts`.
- Accessibility: semantic landmarks, visible focus rings in ESTEI red, `aria-label` on every icon-only button, keyboard-operable slider, carousel and size selectors, colour contrast ≥ 4.5:1.
- Prices format as `৳2,499` using `Intl.NumberFormat('en-BD')`.
- A `README.md` covering local setup, Neon connection, migrations, seeding, admin login, and Vercel deployment with the env vars.

Deliver the complete file tree — do not abbreviate files or leave `// TODO` placeholders.
