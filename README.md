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

