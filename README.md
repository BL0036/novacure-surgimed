# NovaCure Surgimed Suppliers — Product Master Data (Phase 1)

Multi-brand healthcare e-commerce platform. First brand: **Craftscare**
(orthopaedic products, Nepal).

**Phase 1 scope only:** product master data schema + CSV import. No
storefront pages, no admin UI, no authentication yet.

## Stack

- Next.js 16 + TypeScript + Tailwind (`app/` router, `src/` dir)
- PostgreSQL (local dev via a Postgres instance)
- Prisma as the schema/ORM layer (`prisma/schema.prisma` is the source of
  truth for the data model)

## Setup

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL if your local Postgres differs
```

Create the database and apply the schema:

```bash
createdb novacure_dev
psql -d novacure_dev -f prisma/migrations/20260923112504_init/migration.sql
```

### About Prisma CLI (`generate` / `migrate dev`)

`prisma/schema.prisma` defines the full data model and is what future
migrations should be generated from. In the sandbox this was built in,
`npx prisma generate` / `migrate dev` could not run because the Prisma CLI
needs to download engine binaries from `binaries.prisma.sh`, which wasn't
reachable on that network. To get unblocked, the schema was applied by hand
as a plain SQL migration (`prisma/migrations/20260923112504_init/migration.sql`,
written to match `schema.prisma` exactly), and the import script talks to
Postgres directly via `pg` instead of a generated `@prisma/client`.

On a normal machine (or once `binaries.prisma.sh` is reachable), this
should resolve itself:

```bash
npx prisma generate                                    # generates @prisma/client
npx prisma migrate resolve --applied 20260923112504_init  # tells Prisma this migration is already applied
npx prisma migrate dev                                 # future schema changes from here on
```

After that, `scripts/import-products.ts` can be switched from raw `pg`
queries to `@prisma/client` if you'd rather have the generated types —
the query logic maps over directly, table for table.

## Running the import

```bash
npm run import:products -- --file=./path/to/your.csv [--brand-name="Craftscare"] [--brand-slug=craftscare] [--dry-run]
```

- `--dry-run` runs the whole import inside a transaction and rolls it
  back at the end, so you can sanity-check the summary counts before
  writing anything.
- The script is idempotent: products are upserted by `slug`, variants by
  `sku`, brand by `slug`, categories by `(brand, slug)`. Re-running against
  an updated CSV updates existing rows rather than duplicating them.
  `VerificationFlag` rows are cleared and re-inserted per product on each
  run — except any flag already marked `resolved = true`, which is left
  alone so manual review work isn't undone by a re-import.

Expected CSV columns (header row required, any order):
```
product_name, raw_catalogue_name, category, manufacturer_ref_code,
size_label, uom, hs_code, stockist_rate, retail_price, mrp,
vat_status, status, notes
```
One row = one `ProductVariant`. Rows sharing the same `product_name` are
grouped into a single `Product`.

Tested against a 109-row / 80-product sample CSV: 11 categories, 109
variants, 77 verification flags generated, confirmed idempotent on re-run.

## Files

```
prisma/schema.prisma                              — data model (source of truth)
prisma/migrations/20260923112504_init/migration.sql — hand-written SQL matching the schema
scripts/import-products.ts                        — CLI import script
src/lib/db.ts                                     — pg Pool helper
src/lib/slugify.ts                                — slug helper
.env.example                                      — DATABASE_URL template
```

## Schema decisions made during implementation

These deviate slightly from (or fill gaps in) the Phase 1 spec because the
real sample CSV had cases the literal spec didn't cover. Flagging for
review against the Master Plan:

1. **`stockist_rate` and `retail_price` made nullable** on `ProductVariant`.
   The spec's field list didn't mark them nullable, but the sample CSV has
   real rows with blank rates (e.g. one `Knee Cap Hinged` XXL row, the
   `Mallet Finger Splint` row). Rather than coercing a blank to `0`
   (which would silently misstate pricing), the importer stores `null`
   and raises a `missing_price` VerificationFlag.

2. **`raw_catalogue_name` and `manufacturer_ref_code` conflicts across a
   product's variant rows are flagged, not merged silently.** The spec
   puts both fields on `Product` (singular), but several products in the
   sample data have rows with different catalogue names or ref codes for
   the same `product_name` (e.g. "Abdominal Belt" rows use "ABDOMINAL
   BINDER" / "ABDOMINAL BELT" / "ABDOMINAL BELT XXL"; "LS Contoured Belt"
   rows use two different ref codes). The importer takes the first row's
   value as canonical and writes a `raw_name_conflict` / `ref_code_conflict`
   VerificationFlag listing the alternates, so nothing is lost, and an
   admin can reconcile it later.

3. **Product `status` = the least-verified status among its variant rows.**
   Rank order is `draft < needs_verification < verified < published`. A
   product with one `verified` row and one `needs_verification` row comes
   out `needs_verification` overall.

4. **CSV `status` value `missing_info` maps to `draft`.** It isn't one of
   the four schema `ProductStatus` values. The mapping is `verified` →
   `verified`, `needs_verification` → `needs_verification`, `published` →
   `published`, anything else (including `missing_info`) → `draft`. The
   original CSV status is preserved in a VerificationFlag's `issue_type`
   whenever a row has notes, so the "missing_info" reason isn't lost —
   just not stored as a `ProductStatus` value that doesn't exist in the
   enum.

5. **Categories are flat, one level, scoped to a brand.** Some category
   strings in the sample data contain a `/` (e.g. "Back & Lumbar /
   Abdominal") — this reads as one category name, not a parent/child pair,
   so it's stored as a single `Category` row with `parent_category_id =
   null`. The schema supports a real hierarchy (`parent_category_id`) for
   when/if the catalogue actually needs nested categories.

6. **No `ProductImage` rows are created by the importer.** The CSV has no
   image path columns — only notes like "no catalogue photo, photo
   pending." Rather than fabricate placeholder image rows with no real
   path data, the importer leaves `ProductImage` for a later
   image-ingestion step and only records the "photo pending" note as a
   `VerificationFlag` (from the CSV's own `notes` column).

7. **SKU is generated, not supplied.** The CSV has no `sku` column. SKUs
   are derived as `{PRODUCT-SLUG}-{SIZE-LABEL-SLUG}`, upper-cased, with a
   numeric suffix (`-2`, `-3`, …) if two rows for the same product would
   otherwise collide on the same size label — this happens in the sample
   data for "Rom Brace", which has two rows both labeled `S/M/L/XL` at
   very different prices (flagged for the owner to reconcile).

8. **`stockist_rate` exposure.** Phase 1 has no API or UI, so there's
   nothing yet to enforce this against — flagging as a reminder for
   Phase 2: any public-facing query/endpoint must explicitly exclude
   `stockist_rate` rather than `select *`.
