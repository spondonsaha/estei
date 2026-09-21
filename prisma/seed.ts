import { PrismaClient, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const IMG = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const SHOE_IMAGES = [
  "photo-1542291026-7eec264c27ff",
  "photo-1595950653106-6c9ebd614d3a",
  "photo-1560769629-975ec94e6a86",
  "photo-1600185365483-26d7a4cc7519",
  "photo-1606107557195-0e29a4b5b4aa",
  "photo-1539185441755-769473a23570",
  "photo-1608231387042-66d1773070a5",
  "photo-1580910051074-3eb694886505",
  "photo-1549298916-b41d501d3772",
  "photo-1552346154-21d32810aba3",
  "photo-1605348532760-6753d2c43329",
  "photo-1525966222134-fcfa99b8ae77",
  "photo-1600804340584-c7db2eacf4bf",
  "photo-1614252369475-531eba835eb1",
  "photo-1515324605414-1d5cd106ee70",
  "photo-1556906781-9a412961c28c",
  "photo-1543163521-1bf539c55dd2",
  "photo-1560343090-f0409e92791a",
  "photo-1591047139829-d91aecb6caea",
  "photo-1520219306100-ec69c8554020",
  "photo-1514989940723-e8e51635b782",
  "photo-1502904550040-7534597429ae",
  "photo-1602883513714-b58f7e4b8726",
  "photo-1584735175315-9d5df23860e6",
  "photo-1594035910387-fea47794261f",
  "photo-1616051387987-f2b53bdc1d0f",
  "photo-1543508282-6319a3e2621f",
  "photo-1542296332-2e4473faf563",
  "photo-1551107696-a4b0c5a0d9a2",
  "photo-1609505848912-b7c3b8b4beda",
  "photo-1571731956672-f2b94d7dd0cb",
  "photo-1614252235316-8c857d38b5f4",
];

const HERO_IMAGES = [
  IMG("photo-1542291026-7eec264c27ff", 1600),
  IMG("photo-1549298916-b41d501d3772", 1600),
  IMG("photo-1552346154-21d32810aba3", 1600),
];

const CATEGORY_IMAGES = {
  mens: { hero: IMG("photo-1549298916-b41d501d3772", 1600), card: IMG("photo-1542291026-7eec264c27ff") },
  womens: { hero: IMG("photo-1584735175315-9d5df23860e6", 1600), card: IMG("photo-1594035910387-fea47794261f") },
  casual: { hero: IMG("photo-1543163521-1bf539c55dd2", 1600), card: IMG("photo-1560769629-975ec94e6a86") },
  formal: { hero: IMG("photo-1515324605414-1d5cd106ee70", 1600), card: IMG("photo-1539185441755-769473a23570") },
  sports: { hero: IMG("photo-1542296332-2e4473faf563", 1600), card: IMG("photo-1608231387042-66d1773070a5") },
};

const COLOURS = [
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

const MEN_SIZES = ["39", "40", "41", "42", "43", "44", "45"];
const WOMEN_SIZES = ["36", "37", "38", "39", "40"];

const NAMES = [
  "Arif Hasan",
  "Nahid Islam",
  "Tanvir Rahman",
  "Sumaiya Akter",
  "Mehedi Hasan",
  "Farhana Yasmin",
  "Rakibul Islam",
  "Nusrat Jahan",
  "Shakil Ahmed",
  "Tania Islam",
  "Fahim Chowdhury",
  "Sabrina Karim",
  "Imran Hossain",
  "Mim Akter",
  "Jahid Hasan",
  "Rima Sultana",
];

const BODIES = [
  "Very comfortable and stylish. Perfect for daily use. Highly recommended!",
  "Good quality product. Delivery was on time.",
  "Amazing comfort, fits true to size. Love the design!",
  "Been using it for a month now. Still looks brand new. Worth every taka.",
  "Great value for money. The quality surprised me at this price.",
  "Excellent grip and very lightweight. Perfect for long walks.",
  "My second purchase from ESTEI. Never disappointed.",
  "Delivery was fast and the shoes are very comfortable.",
  "Beautiful design and great build quality. Highly satisfied.",
  "Very comfortable for office wear. Would buy again.",
  "Perfect fit and amazing comfort. My go-to shoes now.",
  "The quality is outstanding for the price. 5 stars!",
  "Soft cushioning and great support. Feels premium.",
  "Ordered 2 pairs, both are excellent. Great brand.",
  "Very happy with my purchase. Fast delivery and great shoes.",
  "Combines style and comfort perfectly. Love it!",
];

/** Deterministic rating distribution that averages near `target`. */
function makeDistribution(target: number, count: number): number[] {
  const low = Math.floor(target);
  const high = Math.min(5, low + 1);
  const highCount = Math.round(count * (target - low));
  const lowCount = count - highCount;
  const out: number[] = [];
  for (let i = 0; i < lowCount; i++) out.push(Math.min(5, Math.max(1, low)));
  for (let i = 0; i < highCount; i++) out.push(Math.min(5, Math.max(1, high)));
  for (let i = out.length; i < count; i++) out.push(5);
  while (out.length > count) out.pop();
  return out.reverse();
}

function repeatTo<T>(arr: T[], n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[i % arr.length]);
  return out;
}

type ProductSeed = {
  name: string;
  slug: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
};

async function createCategory(
  slug: string,
  name: string,
  heroTitle: string,
  heroSubtitle: string,
  gender: Gender,
  sortOrder: number,
  allActive: boolean
): Promise<{ id: string; gender: Gender }> {
  const cat = await prisma.category.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      name,
      heroTitle,
      heroSubtitle,
      heroImage: CATEGORY_IMAGES[slug as keyof typeof CATEGORY_IMAGES]?.hero ?? HERO_IMAGES[0],
      cardImage: CATEGORY_IMAGES[slug as keyof typeof CATEGORY_IMAGES]?.card ?? HERO_IMAGES[1],
      gender,
      sortOrder,
      isActive: allActive,
    },
  });
  return { id: cat.id, gender: cat.gender };
}

function withCompare(price: number, pct: number): number {
  return Math.round((price * (1 + pct / 100)) / 100) * 100;
}

async function seedProducts() {
  const categories = await Promise.all([
    createCategory("mens", "Men's", "Men's", "Built for Comfort. Designed for You.", Gender.MEN, 1, true),
    createCategory("womens", "Women's", "Women's", "Elegance in Every Step.", Gender.WOMEN, 2, true),
    createCategory("casual", "Casual", "Casual", "Everyday Comfort. Effortless Style.", Gender.UNISEX, 3, true),
    createCategory("formal", "Formal", "Formal", "Command the Room. Own the Day.", Gender.UNISEX, 4, true),
    createCategory("sports", "Sports", "Sports", "Engineered for Movement. Built to Perform.", Gender.UNISEX, 5, true),
  ]);
  void categories;

  const [mens] = categories;
  const [, womens] = categories;

  const mensProducts: ProductSeed[] = [
    { name: "ESTEI Runner 01", slug: "estei-runner-01", price: 2499, compareAt: 3100, rating: 4.8, reviews: 124, isBestSeller: true, isNewArrival: true },
    { name: "ESTEI Comfort 02", slug: "estei-comfort-02", price: 2799, compareAt: 3400, rating: 4.7, reviews: 86, isBestSeller: true },
    { name: "ESTEI Formal 03", slug: "estei-formal-03", price: 3499, compareAt: 4200, rating: 4.6, reviews: 51 },
    { name: "ESTEI Classic 04", slug: "estei-classic-04", price: 3199, compareAt: 3900, rating: 4.5, reviews: 63 },
    { name: "ESTEI Sport 05", slug: "estei-sport-05", price: 2899, compareAt: 3600, rating: 4.8, reviews: 97, isBestSeller: true, isNewArrival: true },
    { name: "ESTEI Flex 06", slug: "estei-flex-06", price: 2699, compareAt: 3300, rating: 4.7, reviews: 72 },
    { name: "ESTEI Aero 07", slug: "estei-aero-07", price: 3299, rating: 4.6, reviews: 11, isNewArrival: true },
    { name: "ESTEI Kinetic 08", slug: "estei-kinetic-08", price: 2999, rating: 4.5, reviews: 9 },
    { name: "ESTEI Urban 09", slug: "estei-urban-09", price: 2599, rating: 4.7, reviews: 14 },
    { name: "ESTEI Trail 10", slug: "estei-trail-10", price: 3799, rating: 4.4, reviews: 8 },
    { name: "ESTEI Metro 11", slug: "estei-metro-11", price: 2299, rating: 4.6, reviews: 13, isNewArrival: true },
    { name: "ESTEI Edge 12", slug: "estei-edge-12", price: 3999, rating: 4.5, reviews: 10 },
  ];

  const womensProducts: ProductSeed[] = [
    { name: "ESTEI Belle 01", slug: "estei-belle-01", price: 2499, compareAt: 3000, rating: 4.8, reviews: 42, isBestSeller: true },
    { name: "ESTEI Grace 02", slug: "estei-grace-02", price: 2799, compareAt: 3300, rating: 4.7, reviews: 34, isBestSeller: true },
    { name: "ESTEI Trend 03", slug: "estei-trend-03", price: 3199, compareAt: 3800, rating: 4.6, reviews: 28, isNewArrival: true },
    { name: "ESTEI Flow 04", slug: "estei-flow-04", price: 2899, compareAt: 3500, rating: 4.3, reviews: 21 },
    { name: "ESTEI Fit 05", slug: "estei-fit-05", price: 2699, compareAt: 3200, rating: 4.8, reviews: 39, isBestSeller: true },
    { name: "ESTEI Bloom 06", slug: "estei-bloom-06", price: 2999, compareAt: 3600, rating: 4.7, reviews: 26, isNewArrival: true },
    { name: "ESTEI Lily 07", slug: "estei-lily-07", price: 2599, rating: 4.6, reviews: 12 },
    { name: "ESTEI Nova 08", slug: "estei-nova-08", price: 3099, rating: 4.5, reviews: 10 },
    { name: "ESTEI Serene 09", slug: "estei-serene-09", price: 2799, rating: 4.7, reviews: 15 },
    { name: "ESTEI Petal 10", slug: "estei-petal-10", price: 2399, rating: 4.4, reviews: 9 },
    { name: "ESTEI Muse 11", slug: "estei-muse-11", price: 3399, rating: 4.6, reviews: 11, isNewArrival: true },
    { name: "ESTEI Dove 12", slug: "estei-dove-12", price: 2199, rating: 4.5, reviews: 13 },
  ];

  const casualProducts: ProductSeed[] = [
    { name: "ESTEI Everyday 01", slug: "estei-everyday-01", price: 2099, rating: 4.6, reviews: 18, isBestSeller: true },
    { name: "ESTEI Loafer 02", slug: "estei-loafer-02", price: 3299, rating: 4.5, reviews: 12 },
    { name: "ESTEI Slip 03", slug: "estei-slip-03", price: 1999, rating: 4.4, reviews: 15 },
    { name: "ESTEI Cruise 04", slug: "estei-cruise-04", price: 2699, rating: 4.7, reviews: 14, isNewArrival: true },
    { name: "ESTEI Street 05", slug: "estei-street-05", price: 2399, rating: 4.6, reviews: 11 },
    { name: "ESTEI Echo 06", slug: "estei-echo-06", price: 2199, rating: 4.5, reviews: 10 },
    { name: "ESTEI Hush 07", slug: "estei-hush-07", price: 2499, rating: 4.8, reviews: 17, isBestSeller: true },
    { name: "ESTEI Breeze 08", slug: "estei-breeze-08", price: 1899, rating: 4.4, reviews: 9, isNewArrival: true },
    { name: "ESTEI Pivot 09", slug: "estei-pivot-09", price: 2999, rating: 4.5, reviews: 12 },
    { name: "ESTEI Wander 10", slug: "estei-wander-10", price: 2599, rating: 4.6, reviews: 11 },
    { name: "ESTEI Nomad 11", slug: "estei-nomad-11", price: 2799, rating: 4.7, reviews: 13 },
    { name: "ESTEI Vibes 12", slug: "estei-vibes-12", price: 2299, rating: 4.4, reviews: 8 },
  ];

  const formalProducts: ProductSeed[] = [
    { name: "ESTEI Prime 01", slug: "estei-prime-01", price: 3999, rating: 4.7, reviews: 16, isBestSeller: true },
    { name: "ESTEI Executive 02", slug: "estei-executive-02", price: 4799, rating: 4.6, reviews: 11 },
    { name: "ESTEI Officer 03", slug: "estei-officer-03", price: 3599, rating: 4.5, reviews: 13 },
    { name: "ESTEI Metro 04", slug: "estei-metro-formal-04", price: 3399, rating: 4.4, reviews: 9, isNewArrival: true },
    { name: "ESTEI Sovereign 05", slug: "estei-sovereign-05", price: 5299, rating: 4.8, reviews: 15 },
    { name: "ESTEI Classic 06", slug: "estei-classic-formal-06", price: 4199, rating: 4.6, reviews: 10 },
    { name: "ESTEI Statesman 07", slug: "estei-statesman-07", price: 4499, rating: 4.5, reviews: 12 },
    { name: "ESTEI Regal 08", slug: "estei-regal-08", price: 4999, rating: 4.7, reviews: 9 },
    { name: "ESTEI Prestige 09", slug: "estei-prestige-09", price: 3799, rating: 4.4, reviews: 8, isNewArrival: true },
    { name: "ESTEI Parliament 10", slug: "estei-parliament-10", price: 5499, rating: 4.6, reviews: 7 },
    { name: "ESTEI Diplomat 11", slug: "estei-diplomat-11", price: 4699, rating: 4.5, reviews: 10 },
    { name: "ESTEI Chancellor 12", slug: "estei-chancellor-12", price: 5999, rating: 4.7, reviews: 6 },
  ];

  const sportsProducts: ProductSeed[] = [
    { name: "ESTEI Dash 01", slug: "estei-dash-01", price: 2899, rating: 4.8, reviews: 22, isBestSeller: true },
    { name: "ESTEI Sprint 02", slug: "estei-sprint-02", price: 3499, rating: 4.7, reviews: 14 },
    { name: "ESTEI Turbo 03", slug: "estei-turbo-03", price: 3999, rating: 4.6, reviews: 12, isNewArrival: true },
    { name: "ESTEI Stride 04", slug: "estei-stride-04", price: 2699, rating: 4.5, reviews: 11 },
    { name: "ESTEI Velocity 05", slug: "estei-velocity-05", price: 3199, rating: 4.7, reviews: 15 },
    { name: "ESTEI Blaze 06", slug: "estei-blaze-06", price: 3599, rating: 4.6, reviews: 9 },
    { name: "ESTEI Ember 07", slug: "estei-ember-07", price: 2799, rating: 4.4, reviews: 10, isNewArrival: true },
    { name: "ESTEI Zoom 08", slug: "estei-zoom-08", price: 3099, rating: 4.7, reviews: 13 },
    { name: "ESTEI Bolt 09", slug: "estei-bolt-09", price: 2599, rating: 4.5, reviews: 8 },
    { name: "ESTEI Rocket 10", slug: "estei-rocket-10", price: 4299, rating: 4.8, reviews: 11 },
    { name: "ESTEI Storm 11", slug: "estei-storm-11", price: 3399, rating: 4.4, reviews: 9 },
    { name: "ESTEI Glide 12", slug: "estei-glide-12", price: 2499, rating: 4.6, reviews: 12 },
  ];

  const allByCategory: { catId: string; sizeSet: string[]; indexOffset: number; seeds: ProductSeed[] }[] = [
    { catId: mens.id, sizeSet: MEN_SIZES, indexOffset: 0, seeds: mensProducts },
    { catId: womens.id, sizeSet: WOMEN_SIZES, indexOffset: 40, seeds: womensProducts },
    { catId: categories[2].id, sizeSet: MEN_SIZES, indexOffset: 80, seeds: casualProducts },
    { catId: categories[3].id, sizeSet: MEN_SIZES, indexOffset: 120, seeds: formalProducts },
    { catId: categories[4].id, sizeSet: MEN_SIZES, indexOffset: 160, seeds: sportsProducts },
  ];

  for (const group of allByCategory) {
    for (const [pi, seed] of group.seeds.entries()) {
      const idx = group.indexOffset + pi;
      const compareAt = seed.compareAt ?? withCompare(seed.price, 15 + ((pi * 13) % 26));
      const gender: Gender = seed.slug.startsWith("estei-belle") || seed.slug.startsWith("estei-grace") || seed.slug.startsWith("estei-trend") || seed.slug.startsWith("estei-flow") || seed.slug.startsWith("estei-fit") || seed.slug.startsWith("estei-bloom") || seed.slug.startsWith("estei-lily") || seed.slug.startsWith("estei-nova") || seed.slug.startsWith("estei-serene") || seed.slug.startsWith("estei-petal") || seed.slug.startsWith("estei-muse") || seed.slug.startsWith("estei-dove")
        ? Gender.WOMEN
        : group.catId === womens.id
          ? Gender.WOMEN
          : group.catId === mens.id
            ? Gender.MEN
            : Gender.UNISEX;

      const colourCount = 4 + (pi % 3);
      const colours = Array.from({ length: colourCount }, (_, ci) => COLOURS[(idx * 3 + ci * 5) % COLOURS.length]);
      const uniqueColours = colours.filter((c, ci) => colours.findIndex((x) => x.name === c.name) === ci).slice(0, 6);

      const sizeSet = group.sizeSet;
      const stockForSize = new Map<string, number>();
      const outOfStockIndex = (pi * 7) % sizeSet.length;
      sizeSet.forEach((s, si) => {
        stockForSize.set(s, si === outOfStockIndex ? 0 : Math.floor(Math.random() * 30));
      });

      const product = await prisma.product.upsert({
        where: { slug: seed.slug },
        update: {},
        create: {
          name: seed.name,
          slug: seed.slug,
          sku: `ESTEI-${seed.slug.replace(/^estei-/, "").toUpperCase()}`,
          description:
            "Lightweight, breathable and stylish. Perfect for daily wear, walking, and sports activities. Designed with comfort and durability in mind.",
          material: "Mesh Upper, EVA Sole",
          price: seed.price,
          compareAtPrice: compareAt,
          categoryId: group.catId,
          gender,
          isNewArrival: seed.isNewArrival ?? false,
          isBestSeller: seed.isBestSeller ?? false,
          isFeatured: (seed.isNewArrival ?? false) || (seed.isBestSeller ?? false),
          isActive: true,
          avgRating: seed.rating,
          reviewCount: seed.reviews,
          images: {
            create: Array.from({ length: 5 }, (_, ii) => ({
              url: IMG(SHOE_IMAGES[(idx + ii * 7) % SHOE_IMAGES.length]),
              alt: `${seed.name} view ${ii + 1}`,
              colour: uniqueColours[ii % uniqueColours.length]?.name ?? null,
              sortOrder: ii,
            })),
          },
          variants: {
            create: uniqueColours.flatMap((colour) =>
              sizeSet.map((size) => ({
                size,
                colourName: colour.name,
                colourHex: colour.hex,
                stock: stockForSize.get(size) ?? 0,
                sku: `ESTEI-${seed.slug.replace(/^estei-/, "").toUpperCase()}-${size}-${colour.name.replace(/\s+/g, "")}`,
              }))
            ),
          },
        },
      });

      const reviewers = repeatTo(NAMES, seed.reviews);
      const distribution = makeDistribution(seed.rating, seed.reviews);
      const bodies = repeatTo(BODIES, seed.reviews);

      const reviewRows = Array.from({ length: seed.reviews }, (_, ri) => ({
        productId: product.id,
        authorName: reviewers[ri],
        rating: distribution[ri],
        body: bodies[(ri * 3 + idx) % bodies.length],
        isApproved: ri % 25 !== 0, // a couple awaiting moderation
        createdAt: new Date(Date.now() - (ri + 2) * 86400000 * 7),
      }));

      await prisma.review.createMany({ data: reviewRows });

      console.log(`  seeded ${seed.name} (${seed.reviews} reviews)`);
    }
  }
}

async function seedDistricts() {
  const divisions: [string, string[]][] = [
    ["Dhaka", ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"]],
    ["Chattogram", ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cumilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"]],
    ["Rajshahi", ["Bogura", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Rajshahi", "Sirajganj"]],
    ["Khulna", ["Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"]],
    ["Barishal", ["Barguna", "Barishal", "Bhola", "Jhalokathi", "Patuakhali", "Pirojpur"]],
    ["Sylhet", ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"]],
    ["Rangpur", ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"]],
    ["Mymensingh", ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"]],
  ];

  for (const [division, names] of divisions) {
    for (const name of names) {
      await prisma.district.upsert({
        where: { name },
        update: {},
        create: {
          name,
          division,
          shippingFee: name === "Dhaka" ? 80 : 120,
        },
      });
    }
  }
  console.log(`  seeded 64 districts`);
}

async function seedStatic() {
  const sizeRows = [
    ["39", "6", "24.5"],
    ["40", "7", "25.0"],
    ["41", "8", "25.5"],
    ["42", "9", "26.0"],
    ["43", "10", "26.5"],
    ["44", "11", "27.0"],
    ["45", "12", "27.5"],
  ];
  for (let i = 0; i < sizeRows.length; i++) {
    const [eu, uk, cm] = sizeRows[i];
    await prisma.sizeChartRow.upsert({
      where: { id: `men-${eu}` },
      update: {},
      create: { id: `men-${eu}`, chartName: "Men's", euSize: eu, ukSize: uk, footLength: cm, sortOrder: i },
    });
  }
  for (let i = 0; i <= 4; i++) {
    const eu = 36 + i;
    await prisma.sizeChartRow.upsert({
      where: { id: `women-${eu}` },
      update: {},
      create: { id: `women-${eu}`, chartName: "Women's", euSize: String(eu), ukSize: String(3 + i), footLength: String(22.5 + i * 0.5), sortOrder: i },
    });
  }

  const heroSlides = [
    { id: "hero-1", titleTop: "STEP INTO", titleRed: "BETTER DAYS", subtitle: "Premium Footwear for Every Journey", ctaLabel: "Shop Now", ctaHref: "/category/mens" },
    { id: "hero-2", titleTop: "RUN WITH", titleRed: "CONFIDENCE", subtitle: "Engineered comfort that keeps you moving", ctaLabel: "Shop Sports", ctaHref: "/category/sports" },
    { id: "hero-3", titleTop: "STEP OUT", titleRed: "IN STYLE", subtitle: "Trendy looks crafted in our own factory", ctaLabel: "Shop New Arrivals", ctaHref: "/category/new-arrival" },
  ];
  for (const [i, s] of heroSlides.entries()) {
    await prisma.heroSlide.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, image: HERO_IMAGES[i % HERO_IMAGES.length], sortOrder: i, isActive: true },
    });
  }

  const testimonials = [
    { id: "t-1", name: "Tania Akter", role: "Fashion Blogger", quote: "Love the quality and comfort. ESTEI is now my go-to brand.", rating: 5 },
    { id: "t-2", name: "Rafiq Ahmed", role: "Regular Customer", quote: "Stylish, comfortable and durable. Highly recommended!", rating: 5 },
    { id: "t-3", name: "Mitu Rahman", role: "College Student", quote: "Great design at an affordable price. Love it!", rating: 5 },
  ];
  for (const [i, t] of testimonials.entries()) {
    await prisma.testimonial.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, sortOrder: i, isActive: true },
    });
  }
}

async function seedDealer() {
  const packages = [
    { slug: "starter", name: "Starter Package", minPairs: 30, maxPairs: 60, description: "30–60 pairs/month", sortOrder: 1 },
    { slug: "standard", name: "Standard Package", minPairs: 61, maxPairs: 150, description: "61–150 pairs/month", sortOrder: 2 },
    { slug: "premium", name: "Premium Package", minPairs: 151, maxPairs: 400, description: "151–400 pairs/month", sortOrder: 3 },
    { slug: "business", name: "Business Package", minPairs: 401, maxPairs: 800, description: "401–800 pairs/month", sortOrder: 4 },
    { slug: "distributor", name: "Distributor Package", minPairs: 801, maxPairs: null, description: "800+ pairs/month", sortOrder: 5 },
  ];
  for (const p of packages) {
    await prisma.sellPackage.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p },
    });
  }

  const benefits = [
    { icon: "BadgeDollarSign", title: "Attractive Profit Margin", body: "Get the best profit margin in the market with our trusted brand.", section: "WHY", sortOrder: 1 },
    { icon: "ShieldCheck", title: "Factory Direct Supply", body: "Original products directly from our factory.", section: "WHY", sortOrder: 2 },
    { icon: "TicketPercent", title: "Competitive Dealer Price", body: "Get the lowest and most competitive wholesale price.", section: "WHY", sortOrder: 3 },
    { icon: "BadgePlus", title: "Regular New Designs", body: "Stay ahead with the latest styles and trendy designs.", section: "WHY", sortOrder: 4 },
    { icon: "Megaphone", title: "Marketing Support", body: "We'll support your growth with marketing materials and promotional help.", section: "WHY", sortOrder: 5 },
    { icon: "Headset", title: "Dedicated Support", body: "Get help whenever you need from our dedicated team.", section: "WHY", sortOrder: 6 },
    { icon: "Tag", title: "Better Profit Margin", body: "More sales. More earnings.", section: "GET", sortOrder: 1 },
    { icon: "Truck", title: "Timely Supply", body: "Always get your stock on time.", section: "GET", sortOrder: 2 },
    { icon: "Megaphone", title: "Marketing Support", body: "Promotional materials & campaigns.", section: "GET", sortOrder: 3 },
    { icon: "Headset", title: "Dedicated Support", body: "Our team is always with you.", section: "GET", sortOrder: 4 },
    { icon: "MessagesSquare", title: "Dealer Chat System", body: "Real-time help, anytime.", section: "GET", sortOrder: 5 },
  ];
  for (const b of benefits) {
    const lookup = { icon: b.icon, title: b.title, section: b.section };
    const existing = await prisma.dealerBenefit.findFirst({ where: { title: b.title, section: b.section } });
    if (existing) {
      await prisma.dealerBenefit.update({ where: { id: existing.id }, data: lookup });
    } else {
      await prisma.dealerBenefit.create({ data: { ...b, isActive: true } });
    }
  }
  console.log("  seeded 5 sell packages and 11 dealer benefits");
}

async function seedUsers() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "REDACTED";
  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "ESTEI Admin",
      email: adminEmail,
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "Tanim Rahman",
      email: "customer@example.com",
      phone: "01711223344",
      passwordHash: hash,
      role: "CUSTOMER",
    },
  });

  console.log(`  seeded admin user ${adminEmail}`);
}

async function main() {
  console.log("Seeding ESTEI database...");
  await seedStatic();
  await seedDistricts();
  await seedUsers();
  await seedDealer();
  await seedProducts();

  const count = await prisma.newsletterSubscriber.count();
  if (count === 0) {
    await prisma.newsletterSubscriber.createMany({
      data: [{ email: "hello@estei.com.bd" }],
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());