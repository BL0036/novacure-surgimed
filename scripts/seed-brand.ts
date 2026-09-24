/**
 * Phase 2 — ensure the Craftscare Brand row exists.
 *
 * The Phase 1 CSV importer (scripts/import-products.ts) already upserts a
 * Brand row on every run (`ON CONFLICT (slug) DO UPDATE`), so if the
 * Craftscare catalogue has already been imported, this script is a no-op.
 * It exists for the case where Phase 2 routes/nav need to be reviewed
 * before any CSV has been imported yet.
 *
 * Usage:
 *   npm run db:seed-brand -- [--name="Craftscare"] [--slug=craftscare]
 */

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { getPool, closePool } from "../src/lib/db";
import { slugify } from "../src/lib/slugify";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const [key, ...rest] = raw.slice(2).split("=");
    args[key] = rest.length ? rest.join("=") : true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const name = (args.name as string) || "Craftscare";
  const slug = (args.slug as string) || slugify(name);

  const pool = getPool();
  const client = await pool.connect();

  try {
    const existing = await client.query<{ id: string; name: string }>(
      `SELECT id, name FROM brands WHERE slug = $1`,
      [slug]
    );

    if (existing.rows.length > 0) {
      console.log(
        `Brand "${existing.rows[0].name}" (${slug}) already exists — nothing to do.`
      );
      return;
    }

    const id = randomUUID();
    await client.query(
      `INSERT INTO brands (id, name, slug, updated_at)
       VALUES ($1, $2, $3, now())`,
      [id, name, slug]
    );

    console.log(`Created brand "${name}" (${slug}).`);
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
