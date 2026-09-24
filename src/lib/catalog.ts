// Phase 4 — catalogue data access.
//
// Queries Postgres directly via the `pg` pool (src/lib/db.ts), matching
// scripts/import-products.ts's pattern rather than @prisma/client — see
// README.md ("Why raw pg instead of @prisma/client"). Table/column names
// below match the @@map()/@map() names in prisma/schema.prisma, which
// stays the source of truth for the data model.
//
// Every function here is generic against whatever is actually in the
// database — it does not hardcode product names, and returns empty
// results (not fabricated data) if the DB is empty, unreachable, or has
// no matching rows. That's expected at this phase per Phase 4 plan §7.

import { getPool } from "./db";

export const PAGE_SIZE = 20;

export type CategorySort = "name" | "price-asc" | "price-desc";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  /** Lowest variant retail price for this product, as a decimal string, or null if unpriced. */
  minPrice: string | null;
}

export interface ProductListResult {
  products: CatalogProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getCategoryBySlug(
  brandSlug: string,
  categorySlug: string,
): Promise<CategoryRecord | null> {
  try {
    const pool = getPool();
    const res = await pool.query<CategoryRecord>(
      `SELECT c.id, c.name, c.slug
       FROM categories c
       JOIN brands b ON b.id = c.brand_id
       WHERE b.slug = $1 AND c.slug = $2`,
      [brandSlug, categorySlug],
    );
    return res.rows[0] ?? null;
  } catch {
    // DB unreachable/not migrated yet — treat as "category not found"
    // rather than crashing the page.
    return null;
  }
}

/** Distinct size labels actually in stock for a category's published
 *  products — pulled from real ProductVariant rows, never a hardcoded list. */
export async function getCategorySizeLabels(categoryId: string): Promise<string[]> {
  try {
    const pool = getPool();
    const res = await pool.query<{ size_label: string }>(
      `SELECT DISTINCT v.size_label
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       WHERE p.category_id = $1 AND p.publication_status = 'published'
       ORDER BY v.size_label`,
      [categoryId],
    );
    return res.rows.map((r) => r.size_label);
  } catch {
    return [];
  }
}

interface ListCategoryProductsOptions {
  sort?: CategorySort;
  sizeLabel?: string;
  page?: number;
}

export async function listCategoryProducts(
  categoryId: string,
  options: ListCategoryProductsOptions = {},
): Promise<ProductListResult> {
  const page = Math.max(1, options.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filters = ["p.category_id = $1", "p.publication_status = 'published'"];
  const params: unknown[] = [categoryId];

  if (options.sizeLabel) {
    params.push(options.sizeLabel);
    filters.push(
      `EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.size_label = $${params.length})`,
    );
  }

  const whereClause = filters.join(" AND ");
  const orderBy =
    options.sort === "price-asc"
      ? "min_price ASC NULLS LAST, p.name ASC"
      : options.sort === "price-desc"
        ? "min_price DESC NULLS LAST, p.name ASC"
        : "p.name ASC";

  try {
    const pool = getPool();

    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM products p WHERE ${whereClause}`,
      params,
    );
    const total = Number(countRes.rows[0]?.count ?? 0);

    const listParams = [...params, PAGE_SIZE, offset];
    const rowsRes = await pool.query<{
      id: string;
      name: string;
      slug: string;
      short_description: string | null;
      min_price: string | null;
    }>(
      `SELECT p.id, p.name, p.slug, p.short_description,
              (SELECT MIN(v.retail_price) FROM product_variants v WHERE v.product_id = p.id) AS min_price
       FROM products p
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );

    return {
      products: rowsRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        shortDescription: r.short_description,
        minPrice: r.min_price,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  } catch {
    return { products: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 };
  }
}

export interface SearchResultItem extends CatalogProductSummary {
  categoryName: string;
  categorySlug: string;
  brandSlug: string;
}

export interface SearchResult {
  results: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Basic ILIKE search across product name, raw catalogue name, and
 *  category name — sufficient at ~80 products (Phase 4 plan §3). */
export async function searchProducts(query: string, page = 1): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 };
  }

  const like = `%${trimmed}%`;
  const currentPage = Math.max(1, page);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const matchClause = `p.publication_status = 'published' AND (p.name ILIKE $1 OR p.raw_catalogue_name ILIKE $1 OR c.name ILIKE $1)`;

  try {
    const pool = getPool();

    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE ${matchClause}`,
      [like],
    );
    const total = Number(countRes.rows[0]?.count ?? 0);

    const rowsRes = await pool.query<{
      id: string;
      name: string;
      slug: string;
      short_description: string | null;
      category_name: string;
      category_slug: string;
      brand_slug: string;
      min_price: string | null;
    }>(
      `SELECT p.id, p.name, p.slug, p.short_description,
              c.name AS category_name, c.slug AS category_slug, b.slug AS brand_slug,
              (SELECT MIN(v.retail_price) FROM product_variants v WHERE v.product_id = p.id) AS min_price
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN brands b ON b.id = p.brand_id
       WHERE ${matchClause}
       ORDER BY p.name ASC
       LIMIT $2 OFFSET $3`,
      [like, PAGE_SIZE, offset],
    );

    return {
      results: rowsRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        shortDescription: r.short_description,
        minPrice: r.min_price,
        categoryName: r.category_name,
        categorySlug: r.category_slug,
        brandSlug: r.brand_slug,
      })),
      total,
      page: currentPage,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  } catch {
    return { results: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 };
  }
}

/** Formats a decimal-string price (or null) as NPR display text.
 *  Never invents a number — a missing price shows as "Price on request". */
export function formatPrice(minPrice: string | null): string {
  if (minPrice === null) return "Price on request";
  const value = Number(minPrice);
  if (Number.isNaN(value)) return "Price on request";
  return `Rs. ${value.toLocaleString("en-IN")}`;
}
