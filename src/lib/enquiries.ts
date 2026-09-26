// Phase 11 — public enquiry write path. Deliberately separate from
// src/lib/admin/enquiries.ts: this is the one write a completely
// unauthenticated visitor can make against the database (a product
// enquiry or a hospital/pharmacy enquiry), so it's kept small and
// single-purpose rather than folded into the admin module. Same raw-`pg`
// pattern as catalog.ts/admin/products.ts (see README "Why raw pg
// instead of @prisma/client").

import { randomUUID } from "node:crypto";
import { getPool } from "@/lib/db";

export interface CreateEnquiryInput {
  productId: string | null;
  variantId: string | null;
  customerName: string;
  phone: string;
  email: string | null;
  organizationName: string | null;
  addressOrArea: string;
  quantity: number;
  message: string | null;
}

/** Inserts one Enquiry row, always status "new". Foreign keys are
 *  nullable (see schema.prisma comment) — a bad/stale productId or
 *  variantId would fail the FK constraint rather than silently attach
 *  to the wrong product, so callers should only pass IDs they just read
 *  from the database, never a raw form value. */
export async function createEnquiry(input: CreateEnquiryInput): Promise<string> {
  const pool = getPool();
  const id = randomUUID();

  await pool.query(
    `INSERT INTO enquiries
       (id, product_id, variant_id, customer_name, phone, email, organization_name,
        address_or_area, quantity, message, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new', now())`,
    [
      id,
      input.productId,
      input.variantId,
      input.customerName,
      input.phone,
      input.email,
      input.organizationName,
      input.addressOrArea,
      input.quantity,
      input.message,
    ],
  );

  return id;
}
