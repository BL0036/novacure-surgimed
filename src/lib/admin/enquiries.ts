// Phase 11 — admin enquiry data access. Separate from src/lib/enquiries.ts
// (the public write path) the same way admin/products.ts is separate from
// catalog.ts: admin needs every status plus writes to `status`, not just
// the one insert a public visitor can make.

import { getPool } from "@/lib/db";

export type EnquiryStatus = "new" | "contacted" | "confirmed" | "fulfilled" | "cancelled";

export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "fulfilled",
  "cancelled",
];

export interface AdminEnquiryListItem {
  id: string;
  customerName: string;
  phone: string;
  organizationName: string | null;
  productName: string | null;
  variantSizeLabel: string | null;
  quantity: number;
  status: EnquiryStatus;
  createdAt: string;
}

/** Newest first, optionally filtered to one status — /admin/enquiries. */
export async function listEnquiriesAdmin(options: {
  status?: EnquiryStatus;
} = {}): Promise<AdminEnquiryListItem[]> {
  const pool = getPool();
  const params: unknown[] = [];
  let whereClause = "";

  if (options.status) {
    params.push(options.status);
    whereClause = `WHERE e.status = $1`;
  }

  const res = await pool.query<{
    id: string;
    customer_name: string;
    phone: string;
    organization_name: string | null;
    product_name: string | null;
    variant_size_label: string | null;
    quantity: number;
    status: EnquiryStatus;
    created_at: string;
  }>(
    `SELECT e.id, e.customer_name, e.phone, e.organization_name, e.quantity,
            e.status, e.created_at, p.name AS product_name, v.size_label AS variant_size_label
     FROM enquiries e
     LEFT JOIN products p ON p.id = e.product_id
     LEFT JOIN product_variants v ON v.id = e.variant_id
     ${whereClause}
     ORDER BY e.created_at DESC`,
    params,
  );

  return res.rows.map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone,
    organizationName: r.organization_name,
    productName: r.product_name,
    variantSizeLabel: r.variant_size_label,
    quantity: r.quantity,
    status: r.status,
    createdAt: r.created_at,
  }));
}

/** Open ("new") enquiry count for the dashboard badge. */
export async function countNewEnquiries(): Promise<number> {
  const pool = getPool();
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM enquiries WHERE status = 'new'`,
  );
  return Number(res.rows[0]?.count ?? 0);
}

export interface AdminEnquiryDetail {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  organizationName: string | null;
  addressOrArea: string;
  quantity: number;
  message: string | null;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
  productId: string | null;
  productName: string | null;
  productSlug: string | null;
  categorySlug: string | null;
  variantId: string | null;
  variantSizeLabel: string | null;
  variantSku: string | null;
}

export async function getEnquiryById(id: string): Promise<AdminEnquiryDetail | null> {
  const pool = getPool();
  const res = await pool.query<{
    id: string;
    customer_name: string;
    phone: string;
    email: string | null;
    organization_name: string | null;
    address_or_area: string;
    quantity: number;
    message: string | null;
    status: EnquiryStatus;
    created_at: string;
    updated_at: string;
    product_id: string | null;
    product_name: string | null;
    product_slug: string | null;
    category_slug: string | null;
    variant_id: string | null;
    variant_size_label: string | null;
    variant_sku: string | null;
  }>(
    `SELECT e.id, e.customer_name, e.phone, e.email, e.organization_name,
            e.address_or_area, e.quantity, e.message, e.status, e.created_at, e.updated_at,
            p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
            c.slug AS category_slug,
            v.id AS variant_id, v.size_label AS variant_size_label, v.sku AS variant_sku
     FROM enquiries e
     LEFT JOIN products p ON p.id = e.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_variants v ON v.id = e.variant_id
     WHERE e.id = $1`,
    [id],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    organizationName: row.organization_name,
    addressOrArea: row.address_or_area,
    quantity: row.quantity,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    categorySlug: row.category_slug,
    variantId: row.variant_id,
    variantSizeLabel: row.variant_size_label,
    variantSku: row.variant_sku,
  };
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE enquiries SET status = $2, updated_at = now() WHERE id = $1`,
    [id, status],
  );
}
