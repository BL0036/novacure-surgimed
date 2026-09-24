import { getPool } from "@/lib/db";

export interface AdminVerificationFlag {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  issueType: string;
  note: string | null;
  resolved: boolean;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export async function listVerificationFlags(options: {
  resolved?: boolean;
  productId?: string;
}): Promise<AdminVerificationFlag[]> {
  const pool = getPool();
  const filters: string[] = [];
  const params: unknown[] = [];

  if (options.resolved !== undefined) {
    params.push(options.resolved);
    filters.push(`vf.resolved = $${params.length}`);
  }
  if (options.productId) {
    params.push(options.productId);
    filters.push(`vf.product_id = $${params.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const res = await pool.query<{
    id: string;
    product_id: string;
    product_name: string;
    product_slug: string;
    issue_type: string;
    note: string | null;
    resolved: boolean;
    resolution_note: string | null;
    resolved_at: string | null;
    created_at: string;
  }>(
    `SELECT vf.id, vf.product_id, p.name AS product_name, p.slug AS product_slug,
            vf.issue_type, vf.note, vf.resolved, vf.resolution_note, vf.resolved_at, vf.created_at
     FROM verification_flags vf
     JOIN products p ON p.id = vf.product_id
     ${whereClause}
     ORDER BY vf.resolved ASC, vf.created_at DESC`,
    params,
  );

  return res.rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    productSlug: r.product_slug,
    issueType: r.issue_type,
    note: r.note,
    resolved: r.resolved,
    resolutionNote: r.resolution_note,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  }));
}

export async function resolveVerificationFlag(
  id: string,
  resolutionNote: string | null,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE verification_flags
     SET resolved = true, resolution_note = $1, resolved_at = now(), updated_at = now()
     WHERE id = $2`,
    [resolutionNote, id],
  );
}

/** Reopen a flag — lets an admin undo an accidental "resolve". */
export async function reopenVerificationFlag(id: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE verification_flags
     SET resolved = false, resolved_at = NULL, updated_at = now()
     WHERE id = $1`,
    [id],
  );
}
