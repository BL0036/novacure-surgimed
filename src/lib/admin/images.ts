import "server-only";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { getPool } from "@/lib/db";

export type ProductImageType =
  "primary" | "secondary" | "detail" | "packaging" | "size_guide";

export interface AdminProductImage {
  id: string;
  type: ProductImageType;
  webPath: string;
  altText: string | null;
  imageStatus: "pending" | "available";
}

export async function listProductImages(
  productId: string,
): Promise<AdminProductImage[]> {
  const pool = getPool();
  const res = await pool.query<{
    id: string;
    type: ProductImageType;
    web_path: string | null;
    alt_text: string | null;
    image_status: "pending" | "available";
  }>(
    `SELECT id, type, web_path, alt_text, image_status
     FROM product_images WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId],
  );
  return res.rows
    .filter((r): r is typeof r & { web_path: string } => Boolean(r.web_path))
    .map((r) => ({
      id: r.id,
      type: r.type,
      webPath: r.web_path,
      altText: r.alt_text,
      imageStatus: r.image_status,
    }));
}

/** Uploads the file to Vercel Blob and records a ProductImage row.
 *
 *  Phase 8 carry-forward fix: this used to write to public/uploads/products/
 *  on local disk, which does not persist on Vercel's serverless/ephemeral
 *  filesystem in production. Vercel Blob gives every image a real,
 *  persistent, publicly-readable URL instead — `webPath` now stores that
 *  full URL rather than a local `/uploads/...` path. No data migration was
 *  needed for this switch since no real product photos existed in the
 *  database yet (see README "Phase 8 decisions"). */
export async function saveProductImage(
  productId: string,
  file: File,
  type: ProductImageType,
  altText: string | null,
): Promise<string | null> {
  if (file.size === 0) return "No file was selected.";
  if (!file.type.startsWith("image/")) return "That file isn't an image.";

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const pathname = `products/${productId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  const pool = getPool();
  await pool.query(
    `INSERT INTO product_images
       (id, product_id, type, web_path, source, alt_text, image_status, updated_at)
     VALUES ($1, $2, $3, $4, 'own_photograph', $5, 'available', now())`,
    [randomUUID(), productId, type, blob.url, altText],
  );

  return null;
}

export async function deleteProductImage(id: string): Promise<void> {
  const pool = getPool();
  const res = await pool.query<{ web_path: string | null }>(
    `SELECT web_path FROM product_images WHERE id = $1`,
    [id],
  );
  const webPath = res.rows[0]?.web_path;

  await pool.query(`DELETE FROM product_images WHERE id = $1`, [id]);

  if (webPath) {
    await del(webPath).catch(() => {
      // Blob already gone / never existed — the DB row is what matters
      // for correctness, so don't fail the delete over this.
    });
  }
}
