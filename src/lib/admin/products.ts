// Phase 7 — admin product data access. Deliberately separate from
// src/lib/catalog.ts: the public catalog only ever reads published
// products, while admin needs every status, plus writes. Same raw-`pg`
// pattern as catalog.ts (see README "Why raw pg instead of
// @prisma/client").

import { randomUUID } from "node:crypto";
import { getPool } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export type ProductStatus = "draft" | "needs_verification" | "verified" | "published";
export type PublicationStatus = "unpublished" | "published";
export type StockStatus = "in_stock" | "out_of_stock" | "discontinued" | "unknown";
export type VatStatus = "VAT" | "NON_VAT";

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  brandName: string;
  status: ProductStatus;
  publicationStatus: PublicationStatus;
  variantCount: number;
  minRetailPrice: string | null;
  updatedAt: string;
}

export interface AdminProductListResult {
  products: AdminProductListItem[];
  total: number;
}

/** Searchable/sortable product table for /admin/products. Unlike the
 *  public catalog, this returns products of every status. */
export async function listProductsAdmin(options: {
  query?: string;
  sort?: "updated" | "name" | "status";
}): Promise<AdminProductListResult> {
  const pool = getPool();
  const params: unknown[] = [];
  let whereClause = "";

  if (options.query?.trim()) {
    params.push(`%${options.query.trim()}%`);
    whereClause = `WHERE p.name ILIKE $${params.length} OR p.manufacturer_ref_code ILIKE $${params.length}`;
  }

  const orderBy =
    options.sort === "name"
      ? "p.name ASC"
      : options.sort === "status"
        ? "p.status ASC, p.name ASC"
        : "p.updated_at DESC";

  const res = await pool.query<{
    id: string;
    name: string;
    slug: string;
    category_name: string;
    brand_name: string;
    status: ProductStatus;
    publication_status: PublicationStatus;
    variant_count: string;
    min_retail_price: string | null;
    updated_at: string;
  }>(
    `SELECT p.id, p.name, p.slug, c.name AS category_name, b.name AS brand_name,
            p.status, p.publication_status, p.updated_at,
            (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS variant_count,
            (SELECT MIN(v.retail_price) FROM product_variants v WHERE v.product_id = p.id) AS min_retail_price
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN brands b ON b.id = p.brand_id
     ${whereClause}
     ORDER BY ${orderBy}`,
    params,
  );

  return {
    products: res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      categoryName: r.category_name,
      brandName: r.brand_name,
      status: r.status,
      publicationStatus: r.publication_status,
      variantCount: Number(r.variant_count),
      minRetailPrice: r.min_retail_price,
      updatedAt: r.updated_at,
    })),
    total: res.rowCount ?? 0,
  };
}

export interface AdminProductDetail {
  id: string;
  brandId: string;
  categoryId: string;
  name: string;
  rawCatalogueName: string;
  manufacturerRefCode: string | null;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  features: string | null;
  status: ProductStatus;
  publicationStatus: PublicationStatus;
}

export async function getProductForEdit(
  id: string,
): Promise<AdminProductDetail | null> {
  const pool = getPool();
  const res = await pool.query<{
    id: string;
    brand_id: string;
    category_id: string;
    name: string;
    raw_catalogue_name: string;
    manufacturer_ref_code: string | null;
    slug: string;
    short_description: string | null;
    full_description: string | null;
    features: string | null;
    status: ProductStatus;
    publication_status: PublicationStatus;
  }>(
    `SELECT id, brand_id, category_id, name, raw_catalogue_name, manufacturer_ref_code,
            slug, short_description, full_description, features, status, publication_status
     FROM products WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    brandId: row.brand_id,
    categoryId: row.category_id,
    name: row.name,
    rawCatalogueName: row.raw_catalogue_name,
    manufacturerRefCode: row.manufacturer_ref_code,
    slug: row.slug,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    features: row.features,
    status: row.status,
    publicationStatus: row.publication_status,
  };
}

export interface UpdateProductInput {
  name: string;
  categoryId: string;
  manufacturerRefCode: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  features: string | null;
  status: ProductStatus;
  publicationStatus: PublicationStatus;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE products
     SET name = $1, category_id = $2, manufacturer_ref_code = $3,
         short_description = $4, full_description = $5, features = $6,
         status = $7, publication_status = $8, updated_at = now()
     WHERE id = $9`,
    [
      input.name,
      input.categoryId,
      input.manufacturerRefCode,
      input.shortDescription,
      input.fullDescription,
      input.features,
      input.status,
      input.publicationStatus,
      id,
    ],
  );
}

export interface CreateProductInput {
  brandId: string;
  categoryId: string;
  name: string;
  manufacturerRefCode: string | null;
  shortDescription: string | null;
}

/** Creates a new Product with no variants yet — the edit page is where
 *  variants get added afterward. Slug is derived from the name and
 *  de-duplicated with a numeric suffix if it collides. */
export async function createProduct(input: CreateProductInput): Promise<string> {
  const pool = getPool();
  const baseSlug = slugify(input.name);

  let slug = baseSlug;
  let suffix = 2;
  // Small catalogue (~80 products) — a loop here is simpler and plenty
  // fast; not worth a cleverer collision-free scheme.
  while (
    (await pool.query(`SELECT 1 FROM products WHERE slug = $1`, [slug])).rowCount
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const id = randomUUID();
  await pool.query(
    `INSERT INTO products
       (id, brand_id, category_id, name, raw_catalogue_name, manufacturer_ref_code,
        slug, short_description, status, publication_status, updated_at)
     VALUES ($1, $2, $3, $4, $4, $5, $6, $7, 'draft', 'unpublished', now())`,
    [
      id,
      input.brandId,
      input.categoryId,
      input.name,
      input.manufacturerRefCode,
      slug,
      input.shortDescription,
    ],
  );
  return id;
}

export interface AdminVariant {
  id: string;
  sizeLabel: string;
  sku: string;
  uom: string;
  manufacturerRefCode: string | null;
  stockistRate: string | null;
  retailPrice: string | null;
  mrp: string;
  vatStatus: VatStatus;
  stockStatus: StockStatus;
  /** Pretty-printed JSON text (or null) — see UpdateVariantInput.measurementData
   *  for why this is kept as text rather than the parsed object. */
  measurementData: string | null;
}

export async function listProductVariants(productId: string): Promise<AdminVariant[]> {
  const pool = getPool();
  const res = await pool.query<{
    id: string;
    size_label: string;
    sku: string;
    uom: string;
    manufacturer_ref_code: string | null;
    stockist_rate: string | null;
    retail_price: string | null;
    mrp: string;
    vat_status: VatStatus;
    stock_status: StockStatus;
    measurement_data: unknown | null;
  }>(
    `SELECT id, size_label, sku, uom, manufacturer_ref_code, stockist_rate, retail_price,
            mrp, vat_status, stock_status, measurement_data
     FROM product_variants WHERE product_id = $1 ORDER BY size_label`,
    [productId],
  );
  return res.rows.map((r) => ({
    id: r.id,
    sizeLabel: r.size_label,
    sku: r.sku,
    uom: r.uom,
    manufacturerRefCode: r.manufacturer_ref_code,
    stockistRate: r.stockist_rate,
    retailPrice: r.retail_price,
    mrp: r.mrp,
    vatStatus: r.vat_status,
    stockStatus: r.stock_status,
    // pg returns jsonb columns already parsed — re-stringify pretty for
    // the admin textarea so the form loads with readable JSON, not a
    // single unformatted line.
    measurementData: r.measurement_data
      ? JSON.stringify(r.measurement_data, null, 2)
      : null,
  }));
}

export interface UpdateVariantInput {
  sizeLabel: string;
  manufacturerRefCode: string | null;
  stockistRate: string | null;
  retailPrice: string | null;
  mrp: string;
  stockStatus: StockStatus;
  /** Validated JSON text (or null to clear) — validation happens in the
   *  Server Action before this is called (see updateVariantAction), not
   *  here, so the error can be shown back to the admin without a partial
   *  save. Passed straight through as a bound text parameter; Postgres
   *  applies its implicit text->jsonb assignment cast on UPDATE, so no
   *  explicit JSON.parse/stringify round-trip is needed on the way in. */
  measurementData: string | null;
}

export async function updateVariant(
  id: string,
  input: UpdateVariantInput,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE product_variants
     SET size_label = $1, manufacturer_ref_code = $2, stockist_rate = $3, retail_price = $4,
         mrp = $5, stock_status = $6, measurement_data = $7, updated_at = now()
     WHERE id = $8`,
    [
      input.sizeLabel,
      input.manufacturerRefCode,
      input.stockistRate,
      input.retailPrice,
      input.mrp,
      input.stockStatus,
      input.measurementData,
      id,
    ],
  );
}

export interface CreateVariantInput {
  productId: string;
  sizeLabel: string;
  sku: string;
  uom: string;
  mrp: string;
  vatStatus: VatStatus;
}

/** Returns null on success, or an error message (e.g. duplicate SKU) to
 *  show back to the admin. */
export async function createVariant(input: CreateVariantInput): Promise<string | null> {
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO product_variants (id, product_id, size_label, sku, uom, mrp, vat_status, stock_status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'unknown', now())`,
      [
        randomUUID(),
        input.productId,
        input.sizeLabel,
        input.sku,
        input.uom,
        input.mrp,
        input.vatStatus,
      ],
    );
    return null;
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return `SKU "${input.sku}" is already in use — SKUs must be unique.`;
    }
    return "Could not create the variant. Please try again.";
  }
}

export interface CategoryOption {
  id: string;
  name: string;
  brandName: string;
}

/** All categories across all brands, for the product edit/create form's
 *  category select — generic against whatever brands/categories actually
 *  exist, never hardcoded to Craftscare. */
export async function listCategoriesForSelect(): Promise<CategoryOption[]> {
  const pool = getPool();
  const res = await pool.query<{ id: string; name: string; brand_name: string }>(
    `SELECT c.id, c.name, b.name AS brand_name
     FROM categories c
     JOIN brands b ON b.id = c.brand_id
     ORDER BY b.name, c.name`,
  );
  return res.rows.map((r) => ({ id: r.id, name: r.name, brandName: r.brand_name }));
}

/** The single Brand a new product is created under. There's only one
 *  brand live today (Craftscare); this picks the first brand generically
 *  rather than hardcoding the slug, so it keeps working once a second
 *  brand is added and the create form gains a brand selector. */
export async function getDefaultBrandId(): Promise<string | null> {
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `SELECT id FROM brands ORDER BY name LIMIT 1`,
  );
  return res.rows[0]?.id ?? null;
}
