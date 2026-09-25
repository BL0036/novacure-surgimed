/**
 * Phase 9 pilot — applies the project owner's real content to the single
 * "Lumbar Sacro Belt" product (created by the Phase 1 CSV import), as a
 * one-off content pass rather than a repeatable admin workflow.
 *
 * Deliberately narrow and defensive: it looks the product and its two
 * variants up by name/size_label and refuses to run if it finds anything
 * other than exactly one match for each, so a typo or a duplicate row
 * can't cause it to silently touch the wrong product. Everything runs in
 * one transaction — either all four writes land, or none do.
 *
 * Usage:
 *   npm run db:phase9-lumbar-sacro-belt
 */

import "dotenv/config";
import { getPool, closePool } from "../src/lib/db";

const PRODUCT_NAME = "Lumbar Sacro Belt";

const SHORT_DESCRIPTION =
  "A flexible lumbar sacro support belt offering quick relief and comfort, with " +
  "anatomically pre-shaped semi-rigid splints for firm immobilization and correct " +
  "posture.";

const FULL_DESCRIPTION =
  "Made from heat-resistant, high-elasticity rubber for adequate compression. " +
  "Anatomically pre-shaped semi-rigid splints ensure firm immobilization and " +
  "correct posture. The well-tapered back panel offers a sleek, comfortable fit, " +
  "while loop fasteners allow easy size adjustment and buckle fastening makes " +
  "application and removal simple.";

// The `features` column is plain text (see schema.prisma), not a JSON
// array, so the list is joined one-per-line with a leading dash — the
// storefront product page already renders this field with
// `whitespace-pre-line`, so line breaks display correctly as a list.
const FEATURES = [
  "Flexible Sizing",
  "Double Pull Mechanism",
  "Well-Cushioned Back Pad",
  "Long Life",
  "Extra Porous",
  "Flexi-Back Splinting",
]
  .map((line) => `- ${line}`)
  .join("\n");

const SMLXL_REF_CODE = "A-513";
const SMLXL_MEASUREMENT_DATA = JSON.stringify({
  S: { in: "28-32", cm: "70-80" },
  M: { in: "32-36", cm: "80-90" },
  L: { in: "36-40", cm: "90-100" },
  XL: { in: "40-46", cm: "100-115" },
});

const XXL_REF_CODE = "B-513";

async function main() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productRes = await client.query<{ id: string; name: string }>(
      `SELECT id, name FROM products WHERE name ILIKE $1`,
      [PRODUCT_NAME],
    );
    if (productRes.rowCount === 0) {
      throw new Error(
        `No product named "${PRODUCT_NAME}" found — nothing changed. Check the ` +
          `exact name Phase 1's import gave it (products.name) and update ` +
          `PRODUCT_NAME in this script if it differs.`,
      );
    }
    if (productRes.rowCount! > 1) {
      throw new Error(
        `${productRes.rowCount} products matched "${PRODUCT_NAME}" — refusing to ` +
          `guess which one. Narrow the match (e.g. by category or id) and re-run.`,
      );
    }
    const productId = productRes.rows[0].id;

    async function getSingleVariantId(sizeLabel: string): Promise<string> {
      const res = await client.query<{ id: string }>(
        `SELECT id FROM product_variants WHERE product_id = $1 AND size_label = $2`,
        [productId, sizeLabel],
      );
      if (res.rowCount === 0) {
        throw new Error(
          `No variant with size_label "${sizeLabel}" found on "${PRODUCT_NAME}" ` +
            `(product ${productId}) — nothing changed.`,
        );
      }
      if (res.rowCount! > 1) {
        throw new Error(
          `${res.rowCount} variants with size_label "${sizeLabel}" found on ` +
            `"${PRODUCT_NAME}" — refusing to guess which one.`,
        );
      }
      return res.rows[0].id;
    }

    const smlxlVariantId = await getSingleVariantId("S/M/L/XL");
    const xxlVariantId = await getSingleVariantId("XXL");

    await client.query(
      `UPDATE products
       SET short_description = $1, full_description = $2, features = $3,
           status = 'verified', publication_status = 'published', updated_at = now()
       WHERE id = $4`,
      [SHORT_DESCRIPTION, FULL_DESCRIPTION, FEATURES, productId],
    );

    await client.query(
      `UPDATE product_variants
       SET manufacturer_ref_code = $1, measurement_data = $2, updated_at = now()
       WHERE id = $3`,
      [SMLXL_REF_CODE, SMLXL_MEASUREMENT_DATA, smlxlVariantId],
    );

    await client.query(
      `UPDATE product_variants
       SET manufacturer_ref_code = $1, measurement_data = NULL, updated_at = now()
       WHERE id = $2`,
      [XXL_REF_CODE, xxlVariantId],
    );

    await client.query("COMMIT");

    // Re-read everything back so the console output is a genuine
    // confirmation of what's in the database, not just what was sent.
    const confirm = await client.query<{
      name: string;
      status: string;
      publication_status: string;
      short_description: string | null;
      full_description: string | null;
      features: string | null;
    }>(
      `SELECT name, status, publication_status, short_description, full_description, features
       FROM products WHERE id = $1`,
      [productId],
    );
    const variantsConfirm = await client.query<{
      size_label: string;
      manufacturer_ref_code: string | null;
      measurement_data: unknown;
    }>(
      `SELECT size_label, manufacturer_ref_code, measurement_data
       FROM product_variants WHERE product_id = $1 ORDER BY size_label`,
      [productId],
    );

    console.log("Updated product:");
    console.log(confirm.rows[0]);
    console.log("\nVariants:");
    for (const v of variantsConfirm.rows) {
      console.log(v);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
