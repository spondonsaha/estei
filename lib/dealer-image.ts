import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type DetectedImage = {
  buffer: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
};

/** Magic-byte sniffing — never trust the declared MIME type or file extension. */
function sniffMime(buf: Buffer): DetectedImage["mimeType"] | null {
  if (
    buf.length > 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buf.length > 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buf.length > 12 &&
    buf.toString("latin1", 0, 4) === "RIFF" &&
    buf.toString("latin1", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Validates, strips EXIF, auto-orients and re-encodes an uploaded document
 * before it is stored. Returns a normalized buffer + detected MIME type.
 */
export async function normalizeImage(raw: Buffer): Promise<DetectedImage> {
  if (raw.byteLength === 0) throw new Error("Empty file");
  if (raw.byteLength > MAX_UPLOAD_BYTES) throw new Error("File exceeds 5MB");

  const detected = sniffMime(raw);
  if (!detected) throw new Error("Only JPG, PNG or WEBP images are allowed");

  const image = sharp(raw, { animated: false, limitInputPixels: 25_000_000 }).rotate();

  const metadata = await image.metadata().catch(() => null);
  if (!metadata || !metadata.width || !metadata.height) {
    throw new Error("Unsupported or corrupted image file");
  }
  if (metadata.pages && metadata.pages > 1) {
    throw new Error("Animated images are not allowed");
  }

  // Re-encode to WebP (strips EXIF/metadata by default) and sanitize dimensions.
  const buffer = await sharp(await image.toBuffer())
    .rotate()
    .resize({
      width: metadata.width > 4000 ? 4000 : undefined,
      height: metadata.height > 4000 ? 4000 : undefined,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  return { buffer, mimeType: "image/webp", width: metadata.width, height: metadata.height };
}