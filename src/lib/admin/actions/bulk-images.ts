"use server";

import { requireAdminSession } from "@/lib/admin/session";
import { saveProductImage, type ProductImageType } from "@/lib/admin/images";

export interface BulkUploadResult {
  fileName: string;
  productName: string;
  ok: boolean;
  error?: string;
}

/** Uploads a batch of images assigned to products via the bulk-images page.
 *
 *  The form sends three parallel, same-named fields — `files`, `productId`,
 *  `productName` (for the result summary), `type`, `altText` — each
 *  appended once per row in the same order. FormData.getAll() preserves
 *  append order per key, so zipping the four arrays by index recovers each
 *  row correctly without needing per-row field names.
 *
 *  Reuses saveProductImage() (Phase 13) row by row rather than a bulk SQL
 *  insert, since each row is also a Blob upload — same validation
 *  (allowlisted type, 8MB cap) and failure mode as the single-image form,
 *  just looped. One row failing (e.g. an oversized file) does not stop the
 *  rest — every row is attempted and the outcome of each is reported back.
 */
export async function bulkUploadImagesAction(
  formData: FormData,
): Promise<BulkUploadResult[]> {
  await requireAdminSession();

  const files = formData.getAll("files");
  const productIds = formData.getAll("productId").map(String);
  const productNames = formData.getAll("productName").map(String);
  const types = formData.getAll("type").map(String);
  const altTexts = formData.getAll("altText").map(String);

  const results: BulkUploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const productId = productIds[i];
    const productName = productNames[i] || "(unknown product)";
    const type = (types[i] || "primary") as ProductImageType;
    const altText = altTexts[i]?.trim() || null;

    if (!(file instanceof File)) {
      results.push({ fileName: "(missing file)", productName, ok: false, error: "No file." });
      continue;
    }
    if (!productId) {
      results.push({ fileName: file.name, productName, ok: false, error: "No product selected." });
      continue;
    }

    // Each row is caught individually — a Blob/network failure on one image
    // (or any other unexpected throw from saveProductImage) must not lose
    // the outcome of every other row in the batch, unlike the single-image
    // upload form where one failure has nothing else to preserve.
    try {
      const error = await saveProductImage(productId, file, type, altText);
      results.push({ fileName: file.name, productName, ok: !error, error: error ?? undefined });
    } catch {
      results.push({
        fileName: file.name,
        productName,
        ok: false,
        error: "Upload failed. Please try this image again.",
      });
    }
  }

  return results;
}
