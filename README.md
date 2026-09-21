# ESTEI — Bangladeshi Footwear E-Commerce

A production-ready e-commerce platform for **ESTEI**, a Dhaka-based footwear brand. Built with the Next.js App Router, TypeScript, Tailwind CSS v4, Prisma and Neon (serverless PostgreSQL).

## Features

- **Storefront**: fast SEO pages, sticky header with search overlay, hero slider, category tiles, promo banners, product grid with filters (size, colour, price, sort), and pagination.
- **Product detail**: image gallery, colour/size picker, buy box with quantity, wishlist toggle, and 8 tabs (Description, Material, Size Chart, Features, Why ESTEI, Reviews, FAQ, Delivery & Returns).
- **Cart & checkout**: guest cart (localStorage session id) that is adopted into the user account on login, COD / bKash / Nagad / Card, address + district selection, order totals, and full order tracking.
- **Accounts**: login/register (NextAuth v5 credentials + bcrypt + JWT in HTTP cookies), dashboard, order history, wishlist.
- **Dealer program**: public application form with IP rate limiting (3/hr) and application IDs `DLR-YYYY-####`.
- **Admin dashboard** (`/admin`, ADMIN role only): stats overview, product management, order status pipeline, review moderation, dealer approvals, newsletter export (CSV).
- **Content & SEO**: sitemap.xml, robots.txt, custom 404/500/loading states, and 7 info pages (Delivery, COD, Returns, FAQ, Contact, Privacy, Terms).
- **Seed data**: 60 products in 5 categories with 1,281+ reviews (124 for the hero Runner 01), 64 Bangladesh districts, size charts, hero slides and testimonials.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`) + `tailwindcss-animate`
- shadcn-style primitives built on Radix UI + `sonner` toasts
- Prisma ORM + Neon PostgreSQL (pooled + direct connection)
- NextAuth v5 (Auth.js) with credentials provider
- Zod validation, `react-hook-form`, `use-debounce`

## Getting started

### 1. Clone & install

```bash
npm install
```

### 2. Create the database (Neon)

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the `.env.example` file to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string (`?sslmode=require&pgbouncer=true`) |
| `DIRECT_URL` | Neon direct (unpooled) connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` output |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` (local: `http://localhost:3000`) |

> `AUTH_SECRET` is the only NextAuth secret required in v5.

### 3. Push schema & seed

```bash
npm run db:push    # prisma db push
npm run prisma:seed
```

Seeds 60 products, reviews, 64 districts, size charts, admin + demo customer.

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

**Demo accounts** (seeded):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `REDACTED` |
| Customer | `customer@example.com` | `REDACTED` |

Admin area: http://localhost:3000/admin

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:seed` | Run db:push + seed |
| `npm run db:push` | Push schema to Neon |

## Deployment (Vercel)

1. Push the repo to GitHub, then import it in [Vercel](https://vercel.com).
2. Add the same environment variables from `.env` to the Vercel project.
3. Deploy. `app/sitemap.ts` and `app/robots.ts` generate dynamically; storefront pages run on server-rendered SQL (all DB reads go through Prisma).

## Project structure

```
app/
  (pages)              # home, category/[slug], product/[slug], cart, checkout,
                       # order/[orderNumber], account/*, login, register,
                       # dealer, search, contact, faq, info pages, admin/*
  api/                 # REST layer: products, cart, wishlist, orders, reviews,
                       # dealer, newsletter, contact, districts, admin/*, auth
  api/auth/[...nextauth]  # NextAuth v5 credentials handler
  layout.tsx           # fonts, Providers, Header, Footer
  globals.css          # Tailwind v4 design tokens (black + signal red #e01e26)
prisma/
  schema.prisma        # full relational schema
  seed.ts              # 60 products, 1281+ reviews, 64 districts, roles
components/
  ui/                  # button, input, select, dialog, tabs, accordion, ...
  brand/ shared/       # logo, star-rating, product-card, wishlist-button
  layout/  cart/  home/  category/  product/  dealer/  checkout/  search/  contact/  info/
lib/
  prisma.ts  utils.ts  validations.ts  constants.ts  types.ts
  auth.ts    admin.ts  queries.ts       size-charts.ts  product-types.ts
```

## Notes

- All DB-facing server components/pages set `export const dynamic = "force-dynamic"` so they render fresh SQL instead of static snapshots — keep this when editing product/order pages.
- Removing images or changing the schema requires `npm run prisma:generate` again.