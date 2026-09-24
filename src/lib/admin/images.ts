import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { getPool } from "@/lib/db";

export type ProductImageType =
  "primary" | "secondary" | "detail" | "packaging" | "size_guide";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "products");

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

/** Saves the uploaded file to public/uploads/products/<productId>/ and
 *  records a ProductImage row. Local disk storage — fine for a single-
 *  admin, ~80-product catalogue on one Vercel/Node deployment; swap for
 *  blob storage later if the catalogue or admin count grows. */
export async function saveProductImage(
  productId: string,
  file: File,
  type: ProductImageType,
  altText: string | null,
): Promise<string | null> {
  if (file.size === 0) return "No file was selected.";
  if (!file.type.startsWith("image/")) return "That file isn't an image.";

  const productDir = path.join(UPLOAD_ROOT, productId);
  await mkdir(productDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const diskPath = path.join(productDir, filename);
  const webPath = `/uploads/products/${productId}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  const pool = getPool();
  await pool.query(
    `INSERT INTO product_images
       (id, product_id, type, web_path, source, alt_text, image_status, updated_at)
     VALUES ($1, $2, $3, $4, 'own_photograph', $5, 'available', now())`,
    [randomUUID(), productId, type, webPath, altText],
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
    const diskPath = path.join(process.cwd(), "public", webPath);
    await unlink(diskPath).catch(() => {
      // File already gone / never existed on disk — the DB row is what
      // matters for correctness, so don't fail the delete over this.
    });
  }
}
