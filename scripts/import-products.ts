/**
 * CSV → product master data importer.
 *
 * Expected CSV columns (any order, header row required):
 *   product_name, raw_catalogue_name, category, manufacturer_ref_code,
 *   size_label, uom, hs_code, stockist_rate, retail_price, mrp,
 *   vat_status, status, notes
 *
 * One row = one ProductVariant. Rows sharing the same product_name are
 * grouped into a single Product with multiple variants.
 *
 * Usage:
 *   npm run import:products -- --file=./data/products.csv [--brand-name="Craftscare"] [--brand-slug=craftscare] [--dry-run]
 *
 * This script is intentionally generic — it does not hardcode any
 * product, category, or brand name beyond the --brand-name/--brand-slug
 * defaults, so it can be re-run against any CSV matching the column
 * format above.
 */

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import type { PoolClient } from "pg";
import { getPool, closePool } from "../src/lib/db";
import { slugify } from "../src/lib/slugify";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const [key, ...rest] = raw.slice(2).split("=");
    args[key] = rest.length ? rest.join("=") : true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const csvPath = args.file as string | undefined;
const dryRun = Boolean(args["dry-run"]);
const brandName = (args["brand-name"] as string) || "Craftscare";
const brandSlug = (args["brand-slug"] as string) || slugify(brandName);

if (!csvPath) {
  console.error(
    "Usage: npm run import:products -- --file=./path/to.csv [--brand-name=\"Craftscare\"] [--brand-slug=craftscare] [--dry-run]"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CSV row shape and grouping types
// ---------------------------------------------------------------------------
interface CsvRow {
  product_name: string;
  raw_catalogue_name: string;
  category: string;
  manufacturer_ref_code: string;
  size_label: string;
  uom: string;
  hs_code: string;
  stockist_rate: string;
  retail_price: string;
  mrp: string;
  vat_status: string;
  status: string;
  notes: string;
}

const STATUS_RANK: Record<string, number> = {
  draft: 0,
  needs_verification: 1,
  verified: 2,
  published: 3,
};

/** Maps a raw CSV status value to the Prisma ProductStatus enum.
 *  "missing_info" (used in the source data for products awaiting a
 *  catalogue photo or ref code) is not one of the four schema statuses,
 *  so it is treated as "draft" and the reason is preserved as a
 *  VerificationFlag — see README "Schema decisions". */
function mapStatus(raw: string): keyof typeof STATUS_RANK {
  const v = raw.trim().toLowerCase();
  if (v === "verified") return "verified";
  if (v === "needs_verification") return "needs_verification";
  if (v === "published") return "published";
  return "draft"; // covers "missing_info" and any unrecognized value
}

function mapVatStatus(raw: string): "VAT" | "NON_VAT" {
  return raw.trim().toUpperCase().replace(/\s+/g, "_") === "NON_VAT"
    ? "NON_VAT"
    : "VAT";
}

/** Empty string -> null; otherwise the trimmed numeric string (pg accepts
 *  strings for numeric/decimal columns, which avoids float rounding). */
function parseDecimal(raw: string | undefined): string | null {
  const v = (raw ?? "").trim();
  return v === "" ? null : v;
}

function cleanStr(raw: string | undefined): string {
  return (raw ?? "").trim();
}

function nullableStr(raw: string | undefined): string | null {
  const v = cleanStr(raw);
  return v === "" ? null : v;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const fileContent = readFileSync(csvPath!, "utf-8");
  const rows: CsvRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    // Source data has unescaped inch marks (e.g. CAST PADDING 4" non vat)
    // that aren't wrapped in an outer quoted field — relax quote handling
    // so those parse as literal characters instead of erroring.
    relax_quotes: true,
  });

  if (rows.length === 0) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }

  console.log(`Parsed ${rows.length} variant rows from ${csvPath}`);

  // Group rows by product_name (case-sensitive, exact match on the trimmed name).
  const groups = new Map<string, CsvRow[]>();
  for (const row of rows) {
    const key = cleanStr(row.product_name);
    if (!key) continue; // skip malformed rows with no product name
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  console.log(`Grouped into ${groups.size} products`);

  const pool = getPool();
  const client: PoolClient = await pool.connect();

  const summary = {
    brand: "",
    categoriesCreated: 0,
    productsUpserted: 0,
    variantsUpserted: 0,
    flagsInserted: 0,
    warnings: [] as string[],
  };

  try {
    await client.query("BEGIN");

    // --- Brand -------------------------------------------------------------
    const brandId = randomUUID();
    const brandRes = await client.query<{ id: string }>(
      `INSERT INTO brands (id, name, slug, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
       RETURNING id`,
      [brandId, brandName, brandSlug]
    );
    const resolvedBrandId = brandRes.rows[0].id;
    summary.brand = `${brandName} (${brandSlug})`;

    // --- Categories ----------------------------------------------------------
    // Flat, one level, scoped to this brand — see README "Schema decisions"
    // for why category strings aren't split into a parent/child hierarchy.
    const categoryIdByName = new Map<string, string>();
    const uniqueCategoryNames = Array.from(
      new Set(rows.map((r) => cleanStr(r.category)).filter(Boolean))
    );
    for (const name of uniqueCategoryNames) {
      const slug = slugify(name);
      const res = await client.query<{ id: string }>(
        `INSERT INTO categories (id, name, slug, brand_id, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (brand_id, slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
         RETURNING id`,
        [randomUUID(), name, slug, resolvedBrandId]
      );
      categoryIdByName.set(name, res.rows[0].id);
      summary.categoriesCreated++;
    }

    // --- Products + variants -------------------------------------------------
    const usedSkusThisRun = new Set<string>();

    for (const [productName, groupRows] of groups) {
      const primary = groupRows[0];

      const categoryName = cleanStr(primary.category);
      const categoryId = categoryIdByName.get(categoryName);
      if (!categoryId) {
        summary.warnings.push(
          `Product "${productName}": category "${categoryName}" missing/blank — row skipped entirely.`
        );
        continue;
      }

      const rawCatalogueName = cleanStr(primary.raw_catalogue_name);
      const rawNameAlternates = Array.from(
        new Set(
          groupRows
            .map((r) => cleanStr(r.raw_catalogue_name))
            .filter((v) => v && v !== rawCatalogueName)
        )
      );

      const refCode =
        groupRows.map((r) => nullableStr(r.manufacturer_ref_code)).find((v) => v) ??
        null;
      const refCodeAlternates = Array.from(
        new Set(
          groupRows
            .map((r) => nullableStr(r.manufacturer_ref_code))
            .filter((v): v is string => Boolean(v) && v !== refCode)
        )
      );

      const hsCode =
        groupRows.map((r) => nullableStr(r.hs_code)).find((v) => v) ?? null;

      // Product status = least-verified status among its variant rows,
      // so a product is only as "trusted" as its weakest data point.
      const mappedStatuses = groupRows.map((r) => mapStatus(r.status));
      const productStatus = mappedStatuses.reduce((worst, cur) =>
        STATUS_RANK[cur] < STATUS_RANK[worst] ? cur : worst
      );

      const slug = slugify(productName);

      const productRes = await client.query<{ id: string }>(
        `INSERT INTO products (
           id, brand_id, category_id, name, raw_catalogue_name,
           manufacturer_ref_code, slug, hs_code, status, publication_status, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'unpublished',now())
         ON CONFLICT (slug) DO UPDATE SET
           category_id = EXCLUDED.category_id,
           raw_catalogue_name = EXCLUDED.raw_catalogue_name,
           manufacturer_ref_code = EXCLUDED.manufacturer_ref_code,
           hs_code = EXCLUDED.hs_code,
           status = EXCLUDED.status,
           updated_at = now()
         RETURNING id`,
        [
          randomUUID(),
          resolvedBrandId,
          categoryId,
          productName,
          rawCatalogueName,
          refCode,
          slug,
          hsCode,
          productStatus,
        ]
      );
      const productId = productRes.rows[0].id;
      summary.productsUpserted++;

      // Clear this run's *unresolved* flags before re-adding fresh ones,
      // so re-running the importer on an updated CSV doesn't pile up
      // duplicate flags. Flags already marked resolved=true are left alone.
      await client.query(
        `DELETE FROM verification_flags WHERE product_id = $1 AND resolved = false`,
        [productId]
      );

      if (rawNameAlternates.length > 0) {
        await client.query(
          `INSERT INTO verification_flags (id, product_id, issue_type, note, updated_at)
           VALUES ($1,$2,'raw_name_conflict',$3,now())`,
          [
            randomUUID(),
            productId,
            `Variant rows used different catalogue names: ${rawNameAlternates.join(", ")} (product uses "${rawCatalogueName}")`,
          ]
        );
        summary.flagsInserted++;
      }

      if (refCodeAlternates.length > 0) {
        await client.query(
          `INSERT INTO verification_flags (id, product_id, issue_type, note, updated_at)
           VALUES ($1,$2,'ref_code_conflict',$3,now())`,
          [
            randomUUID(),
            productId,
            `Variant rows used different manufacturer ref codes: ${refCodeAlternates.join(", ")} (product uses "${refCode}")`,
          ]
        );
        summary.flagsInserted++;
      }

      // --- Variants ------------------------------------------------------
      for (const row of groupRows) {
        const sizeLabel = cleanStr(row.size_label) || "Universal";
        const skuBase = `${slug}-${slugify(sizeLabel)}`.toUpperCase();
        let sku = skuBase;
        let suffix = 2;
        while (usedSkusThisRun.has(sku)) {
          sku = `${skuBase}-${suffix}`;
          suffix++;
        }
        usedSkusThisRun.add(sku);

        const stockistRate = parseDecimal(row.stockist_rate);
        const retailPrice = parseDecimal(row.retail_price);
        const mrp = parseDecimal(row.mrp) ?? "0";
        const vatStatus = mapVatStatus(row.vat_status);
        const uom = cleanStr(row.uom) || "Pcs";

        await client.query(
          `INSERT INTO product_variants (
             id, product_id, size_label, sku, uom,
             stockist_rate, retail_price, mrp, vat_status, stock_status, updated_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'unknown',now())
           ON CONFLICT (sku) DO UPDATE SET
             size_label = EXCLUDED.size_label,
             uom = EXCLUDED.uom,
             stockist_rate = EXCLUDED.stockist_rate,
             retail_price = EXCLUDED.retail_price,
             mrp = EXCLUDED.mrp,
             vat_status = EXCLUDED.vat_status,
             updated_at = now()`,
          [
            randomUUID(),
            productId,
            sizeLabel,
            sku,
            uom,
            stockistRate,
            retailPrice,
            mrp,
            vatStatus,
          ]
        );
        summary.variantsUpserted++;

        // Flags derived directly from this row.
        const rowStatus = mapStatus(row.status);
        const notes = nullableStr(row.notes);

        if (notes) {
          await client.query(
            `INSERT INTO verification_flags (id, product_id, issue_type, note, updated_at)
             VALUES ($1,$2,$3,$4,now())`,
            [randomUUID(), productId, cleanStr(row.status) || rowStatus, `[${sku}] ${notes}`]
          );
          summary.flagsInserted++;
        }

        if (stockistRate === null || retailPrice === null) {
          await client.query(
            `INSERT INTO verification_flags (id, product_id, issue_type, note, updated_at)
             VALUES ($1,$2,'missing_price',$3,now())`,
            [
              randomUUID(),
              productId,
              `[${sku}] Missing ${stockistRate === null ? "stockist_rate" : ""}${
                stockistRate === null && retailPrice === null ? " and " : ""
              }${retailPrice === null ? "retail_price" : ""} in source CSV.`,
            ]
          );
          summary.flagsInserted++;
        }
      }
    }

    if (dryRun) {
      await client.query("ROLLBACK");
      console.log("\n--dry-run set: rolled back, nothing was written.");
    } else {
      await client.query("COMMIT");
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await closePool();
  }

  console.log("\n--- Import summary ---");
  console.log(`Brand:               ${summary.brand}`);
  console.log(`Categories upserted: ${summary.categoriesCreated}`);
  console.log(`Products upserted:   ${summary.productsUpserted}`);
  console.log(`Variants upserted:   ${summary.variantsUpserted}`);
  console.log(`Flags inserted:      ${summary.flagsInserted}`);
  if (summary.warnings.length > 0) {
    console.log(`\nWarnings (${summary.warnings.length}):`);
    for (const w of summary.warnings) console.log(`  - ${w}`);
  }
}

main().catch((err) => {
  console.error("\nImport failed:", err);
  process.exit(1);
});
