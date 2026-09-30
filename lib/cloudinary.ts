import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  // Uploads will fail loudly at call time rather than silently writing nowhere.
  console.warn(
    "CLOUDINARY_CLOUD_NAME is not set - product image uploads will fail.",
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
  secure: true,
});

export type StoredProductImage = {
  url: string;
  storageKey: string;
  width: number;
  height: number;
  bytes: number;
};

/** Uploads an already-normalised buffer and returns its Cloudinary handle. */
export async function uploadProductImage(
  buffer: Buffer,
  sku: string,
): Promise<StoredProductImage> {
  const safeSku = sku.replace(/[^A-Za-z0-9_-]/g, "") || "product";

  // upload_stream is used rather than upload() because the SDK's `upload` type
  // only accepts a string (or base64 data URI), while these buffers come
  // straight out of sharp and would otherwise pay ~33% base64 overhead.
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "estei/products",
        public_id: `${safeSku}-${Date.now()}`,
        resource_type: "image",
        overwrite: false,
      },
      (err, uploaded) => {
        if (err) reject(err);
        else if (uploaded) resolve(uploaded);
        else reject(new Error("Cloudinary returned no result"));
      },
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    storageKey: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

/**
 * Removes a previously uploaded asset. Failures are swallowed by callers that
 * are already inside a delete flow - a leaked asset is preferable to a failed
 * database delete.
 */
export async function destroyProductImage(
  storageKey: string,
): Promise<void> {
  await cloudinary.uploader.destroy(storageKey);
}

/**
 * Delivery URL with Cloudinary-side optimisation.
 *
 * Only use this when you also stop next/image optimising the same asset,
 * otherwise the image is transformed twice and you pay two transformation
 * credits for one delivery. See the deployment notes in the PR description.
 */
export function productDeliveryUrl(url: string, width: number): string {
  const u = new URL(url);
  return `${u.origin}${u.pathname}?f_auto,q_auto,w_${width}`;
}