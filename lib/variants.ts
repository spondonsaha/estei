/**
 * Canonical helpers for working with product variant identities.
 *
 * A variant is uniquely identified by the (size, colourName) pair — see the
 * `@@unique([productId, size, colourName])` constraint in prisma/schema.prisma.
 * These helpers exist so that key construction and SKU generation are defined
 * in exactly one place.
 *
 * NOTE: two key orders are in use, and they are deliberately kept distinct:
 *   - `sizeColourKey` is the server-side identity/dedup key.
 *   - `colourSizeKey` is the client-side key for per-colour stock input state.
 * They are NOT interchangeable. Always use the named helper for the job at
 * hand rather than writing a `::` template string inline.
 */

export type VariantSizeColour = { size: string; colourName: string };

/** Server-side identity key for a variant. Order: size, then colour. */
export function sizeColourKey(size: string, colourName: string): string {
  return `${size}::${colourName}`;
}

/** Client-side key for per-colour/per-size stock form state. Order: colour, then size. */
export function colourSizeKey(colourName: string, size: string): string {
  return `${colourName}::${size}`;
}

/** Splits a key produced by `colourSizeKey` back into its parts. */
export function parseColourSizeKey(
  key: string
): { colourName: string; size: string } {
  const [colourName, size] = key.split("::");
  return { colourName, size };
}

/**
 * Builds the unique `ProductVariant.sku` from its parent product SKU.
 *
 * Only the colour name is stripped of non-alphanumerics, matching the
 * original inline template this replaced. Sizes are passed through as-is.
 */
export function buildVariantSku(parentSku: string, size: string, colourName: string): string {
  return `${parentSku}-${size}-${colourName.replace(/[^A-Za-z0-9]+/g, "")}`;
}

/**
 * Finds duplicates within a batch of variants, comparing on (size, colourName).
 * Returns the first duplicate found, or null when the batch is clean.
 */
export function findDuplicateVariant(
  variants: readonly VariantSizeColour[]
): VariantSizeColour | null {
  const seen = new Set<string>();
  for (const variant of variants) {
    const key = sizeColourKey(variant.size, variant.colourName);
    if (seen.has(key)) return variant;
    seen.add(key);
  }
  return null;
}
