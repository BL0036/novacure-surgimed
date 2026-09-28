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

/** Primary photo shown on a product card, or null when the product has no
 *  available photo yet (the card then shows its placeholder). */
export interface CardImage {
  src: string;
  alt: string | null;
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  /** Lowest variant retail price for this product, as a decimal string, or null if unpriced. */
  minPrice: string | null;
  /** Primary photo, if one has been uploaded and marked available. */
  image?: CardImage | null;
}

// Visual upgrade — selects a product's card photo: prefer the row typed
// "primary", otherwise the oldest available photo. Same availability rule
// as the product page gallery (image_status = 'available' with a web_path).
const CARD_IMAGE_SQL = `
  (SELECT pi.web_path FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_status = 'available' AND pi.web_path IS NOT NULL
    ORDER BY (pi.type = 'primary') DESC, pi.created_at ASC LIMIT 1) AS image_src,
  (SELECT pi.alt_text FROM product_images pi
    WHERE pi.product_id = p.id AND pi.image_status = 'available' AND pi.web_path IS NOT NULL
    ORDER BY (pi.type = 'primary') DESC, pi.created_at ASC LIMIT 1) AS image_alt`;

function toCardImage(row: { image_src: string | null; image_alt: string | null }): CardImage | null {
  return row.image_src ? { src: row.image_src, alt: row.image_alt } : null;
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

export interface ProductWithSizeChart {
  name: string;
  slug: string;
}

/** Published products in a category that have a real size chart on at
 *  least one variant (Phase 10 §2) — used by /size-guide to link out to
 *  actual product pages instead of inventing chart data on the guide
 *  page itself. Empty array (not a placeholder) when none exist yet. */
export async function getProductsWithSizeChart(
  categoryId: string,
): Promise<ProductWithSizeChart[]> {
  try {
    const pool = getPool();
    const res = await pool.query<{ name: string; slug: string }>(
      `SELECT DISTINCT p.name, p.slug
       FROM products p
       JOIN product_variants v ON v.product_id = p.id
       WHERE p.category_id = $1
         AND p.publication_status = 'published'
         AND v.measurement_data IS NOT NULL
       ORDER BY p.name ASC`,
      [categoryId],
    );
    return res.rows;
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
  // Phase 10 §4 — verified products lead, draft (and any other non-verified
  // status) follow, regardless of which sort is active; name/price stay as
  // the tiebreaker within each group rather than a second, competing order.
  const statusRank = "(CASE WHEN p.status = 'verified' THEN 0 ELSE 1 END)";
  const orderBy =
    options.sort === "price-asc"
      ? `${statusRank} ASC, min_price ASC NULLS LAST, p.name ASC`
      : options.sort === "price-desc"
        ? `${statusRank} ASC, min_price DESC NULLS LAST, p.name ASC`
        : `${statusRank} ASC, p.name ASC`;

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
      image_src: string | null;
      image_alt: string | null;
    }>(
      `SELECT p.id, p.name, p.slug, p.short_description,
              (SELECT MIN(v.retail_price) FROM product_variants v WHERE v.product_id = p.id) AS min_price,
              ${CARD_IMAGE_SQL}
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
        image: toCardImage(r),
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
      image_src: string | null;
      image_alt: string | null;
    }>(
      `SELECT p.id, p.name, p.slug, p.short_description,
              c.name AS category_name, c.slug AS category_slug, b.slug AS brand_slug,
              (SELECT MIN(v.retail_price) FROM product_variants v WHERE v.product_id = p.id) AS min_price,
              ${CARD_IMAGE_SQL}
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
        image: toCardImage(r),
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

export interface ProductVariantSummary {
  id: string;
  sizeLabel: string;
  sku: string;
  uom: string;
  /** Never stockistRate — that's internal-only, see schema.prisma comment. */
  retailPrice: string | null;
  mrp: string;
  stockStatus: "in_stock" | "out_of_stock" | "discontinued" | "unknown";
  /** Phase 9 §1 — falls back to ProductDetail.manufacturerRefCode when
   *  unset (same fallback the admin form uses). */
  manufacturerRefCode: string | null;
  /** Free-form per schema.prisma (jsonb) — pg returns it already parsed.
   *  Left as `unknown` here rather than assuming a shape; the display
   *  component (SizeChart) validates its own shape before rendering. */
  measurementData: unknown | null;
}

export interface ProductImageSummary {
  id: string;
  type: "primary" | "secondary" | "detail" | "packaging" | "size_guide";
  webPath: string;
  altText: string | null;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  features: string | null;
  manufacturerRefCode: string | null;
  /** ProductStatus, not PublicationStatus — used to gate Product JSON-LD
   *  (Phase 8 §5): only "published" status gets structured data, even
   *  though this query already only returns publication_status =
   *  'published' rows (the two fields are set independently by the admin —
   *  see README "Phase 7 decisions"). */
  status: "draft" | "needs_verification" | "verified" | "published";
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  brandName: string;
  brandSlug: string;
  variants: ProductVariantSummary[];
  images: ProductImageSummary[];
}

/** Full product detail for the public product page, scoped to a brand +
 *  category slug (so /craftscare/knee/foo 404s if "foo" isn't actually in
 *  "knee" even though the slug itself is globally unique). Only returns
 *  publication_status = 'published' products — draft/verification-pending
 *  products are never reachable on the public site. Never selects
 *  stockist_rate (internal cost price — see schema.prisma comment). */
export async function getProductBySlug(
  brandSlug: string,
  categorySlug: string,
  productSlug: string,
): Promise<ProductDetail | null> {
  try {
    const pool = getPool();

    const productRes = await pool.query<{
      id: string;
      name: string;
      slug: string;
      short_description: string | null;
      full_description: string | null;
      features: string | null;
      manufacturer_ref_code: string | null;
      status: ProductDetail["status"];
      category_id: string;
      category_name: string;
      category_slug: string;
      brand_name: string;
      brand_slug: string;
    }>(
      `SELECT p.id, p.name, p.slug, p.short_description, p.full_description, p.features,
              p.manufacturer_ref_code, p.status, c.id AS category_id, c.name AS category_name,
              c.slug AS category_slug, b.name AS brand_name, b.slug AS brand_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN brands b ON b.id = p.brand_id
       WHERE b.slug = $1 AND c.slug = $2 AND p.slug = $3 AND p.publication_status = 'published'`,
      [brandSlug, categorySlug, productSlug],
    );
    const product = productRes.rows[0];
    if (!product) return null;

    const [variantsRes, imagesRes] = await Promise.all([
      pool.query<{
        id: string;
        size_label: string;
        sku: string;
        uom: string;
        retail_price: string | null;
        mrp: string;
        stock_status: ProductVariantSummary["stockStatus"];
        manufacturer_ref_code: string | null;
        measurement_data: unknown | null;
      }>(
        `SELECT id, size_label, sku, uom, retail_price, mrp, stock_status,
                manufacturer_ref_code, measurement_data
         FROM product_variants WHERE product_id = $1 ORDER BY size_label ASC`,
        [product.id],
      ),
      pool.query<{
        id: string;
        type: ProductImageSummary["type"];
        web_path: string | null;
        alt_text: string | null;
      }>(
        `SELECT id, type, web_path, alt_text
         FROM product_images
         WHERE product_id = $1 AND image_status = 'available' AND web_path IS NOT NULL
         ORDER BY type ASC`,
        [product.id],
      ),
    ]);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.short_description,
      fullDescription: product.full_description,
      features: product.features,
      manufacturerRefCode: product.manufacturer_ref_code,
      status: product.status,
      categoryId: product.category_id,
      categoryName: product.category_name,
      categorySlug: product.category_slug,
      brandName: product.brand_name,
      brandSlug: product.brand_slug,
      variants: variantsRes.rows.map((r) => ({
        id: r.id,
        sizeLabel: r.size_label,
        sku: r.sku,
        uom: r.uom,
        retailPrice: r.retail_price,
        mrp: r.mrp,
        stockStatus: r.stock_status,
        manufacturerRefCode: r.manufacturer_ref_code,
        measurementData: r.measurement_data,
      })),
      images: imagesRes.rows
        .filter((r): r is typeof r & { web_path: string } => Boolean(r.web_path))
        .map((r) => ({
          id: r.id,
          type: r.type,
          webPath: r.web_path,
          altText: r.alt_text,
        })),
    };
  } catch {
    return null;
  }
}

/** 2-3 other published products in the same category, for the product
 *  page's "related products" rail (Phase 8 §3). */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 3,
): Promise<CatalogProductSummary[]> {
  try {
    const pool = getPool();
    const res = await pool.query<{
      id: string;
      name: string;
      slug: string;
      short_description: string | null;
      min_price: string | null;
      image_src: string | null;
      image_alt: string | null;
    }>(
      `SELECT p.id, p.name, p.slug, p.short_description,
              (SELECT MIN(v.retail_price) FROM product_variants v WHERE v.product_id = p.id) AS min_price,
              ${CARD_IMAGE_SQL}
       FROM products p
       WHERE p.category_id = $1 AND p.id != $2 AND p.publication_status = 'published'
       ORDER BY p.updated_at DESC
       LIMIT $3`,
      [categoryId, excludeProductId, limit],
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      shortDescription: r.short_description,
      minPrice: r.min_price,
      image: toCardImage(r),
    }));
  } catch {
    return [];
  }
}

export interface FeaturedProduct extends CatalogProductSummary {
  categorySlug: string;
}

/** Homepage "Featured/Popular products" section (Phase 8 §2, items 3 & 6).
 *  There's no "featured" flag and no order/sales data to base "popular"
 *  on, so both sections use this same honest default: the most recently
 *  updated published products, brand-wide. See README "Phase 8 decisions"
 *  for why this became one section instead of two. */
export async function getFeaturedProducts(
  brandSlug: string,
  limit = 8,
): Promise<FeaturedProduct[]> {
  try {
    const pool = getPool();
    const res = await pool.query<{
      id: string;
      name: string;
      slug: string;
      short_description: string | null;
      category_slug: string;
      min_price: string | null;
      image_src: string | null;
      image_alt: string | null;
    }>(
      `SELECT p.id, p.name, p.slug, p.short_description, c.slug AS category_slug,
              (SELECT MIN(v.retail_price) FROM product_variants v WHERE v.product_id = p.id) AS min_price,
              ${CARD_IMAGE_SQL}
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN brands b ON b.id = p.brand_id
       WHERE b.slug = $1 AND p.publication_status = 'published'
       ORDER BY p.updated_at DESC
       LIMIT $2`,
      [brandSlug, limit],
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      shortDescription: r.short_description,
      categorySlug: r.category_slug,
      minPrice: r.min_price,
      image: toCardImage(r),
    }));
  } catch {
    return [];
  }
}

export interface SitemapProduct {
  slug: string;
  categorySlug: string;
  updatedAt: string;
}

/** Every published product for one brand, for sitemap.ts — Phase 12 §5.
 *  Deliberately minimal (no name/price/description): the sitemap only
 *  needs a URL and a lastModified date, and this way it never has to
 *  change shape again just because product-detail fields change. */
export async function listPublishedProductsForSitemap(
  brandSlug: string,
): Promise<SitemapProduct[]> {
  try {
    const pool = getPool();
    const res = await pool.query<{
      slug: string;
      category_slug: string;
      updated_at: string;
    }>(
      `SELECT p.slug, c.slug AS category_slug, p.updated_at
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN brands b ON b.id = p.brand_id
       WHERE b.slug = $1 AND p.publication_status = 'published'
       ORDER BY p.slug ASC`,
      [brandSlug],
    );
    return res.rows.map((r) => ({
      slug: r.slug,
      categorySlug: r.category_slug,
      updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}

// Re-exported from ./format (not defined here) so Client Components can
// import formatPrice/resolveVariantRefCode without pulling in this
// file's `pg`/getPool() import chain — see format.ts for why.
export { formatPrice, resolveVariantRefCode } from "./format";
