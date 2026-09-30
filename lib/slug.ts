const MAX_SLUG = 150;
const SUFFIX_ROOM = 6;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG - SUFFIX_ROOM)
    .replace(/-+$/g, "");
}

export function slugBase(input: string, fallback: string): string {
  return slugify(input) || slugify(fallback) || "product";
}