import { prisma } from "@/lib/prisma";
import { slugBase } from "@/lib/slug";

export async function uniqueProductSlug(
  raw: string,
  fallback: string,
  excludeId?: string
): Promise<string> {
  const base = slugBase(raw, fallback);
  let candidate = base;

  for (let suffix = 2; suffix < 500; suffix += 1) {
    const clash = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === excludeId) return candidate;
    candidate = `${base}-${suffix}`;
  }

  return `${base}-${Date.now()}`;
}