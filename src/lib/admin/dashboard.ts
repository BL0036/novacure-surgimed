import { getPool } from "@/lib/db";

export interface AdminDashboardCounts {
  totalProducts: number;
  publishedProducts: number;
  unresolvedFlags: number;
  pendingImages: number;
  newEnquiries: number;
}

export async function getDashboardCounts(): Promise<AdminDashboardCounts> {
  const pool = getPool();
  const res = await pool.query<{
    total_products: string;
    published_products: string;
    unresolved_flags: string;
    pending_images: string;
    new_enquiries: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM products) AS total_products,
       (SELECT COUNT(*) FROM products WHERE publication_status = 'published') AS published_products,
       (SELECT COUNT(*) FROM verification_flags WHERE resolved = false) AS unresolved_flags,
       (SELECT COUNT(*) FROM product_images WHERE image_status = 'pending') AS pending_images,
       (SELECT COUNT(*) FROM enquiries WHERE status = 'new') AS new_enquiries`,
  );
  const row = res.rows[0];
  return {
    totalProducts: Number(row?.total_products ?? 0),
    publishedProducts: Number(row?.published_products ?? 0),
    unresolvedFlags: Number(row?.unresolved_flags ?? 0),
    pendingImages: Number(row?.pending_images ?? 0),
    newEnquiries: Number(row?.new_enquiries ?? 0),
  };
}
