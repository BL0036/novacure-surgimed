# NovaCure Surgimed Suppliers

Multi-brand healthcare e-commerce platform. First brand: **Craftscare**
(orthopaedic products, Nepal).

**Current scope (through Phase 7):** product master data + CSV import
(Phase 1), storefront routes/IA/SEO (Phases 2–4), UI/UX design system
(Phase 5), and admin auth + product management (Phase 7 — Phase 6 was a
checkpoint, not a coding phase). No customer accounts, cart/checkout, or
reporting yet.

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
psql -d novacure_dev -f prisma/migrations/20260924040000_phase7_admin/migration.sql
```

### About Prisma CLI (`generate` / `migrate dev`)

`prisma/schema.prisma` defines the full data model and is what future
migrations should be generated from. In the sandbox this was built in,
`npx prisma generate` / `migrate dev` could not run because the Prisma CLI
needs to download engine binaries from `binaries.prisma.sh`, which wasn't
reachable on that network. To get unblocked, the schema was applied by hand
as plain SQL migrations (`prisma/migrations/20260923112504_init/migration.sql`,
`prisma/migrations/20260924040000_phase7_admin/migration.sql` — each written
to match `schema.prisma` exactly), and all app code talks to Postgres
directly via `pg` instead of a generated `@prisma/client`.

On a normal machine (or once `binaries.prisma.sh` is reachable), this
should resolve itself:

```bash
npx prisma generate                                          # generates @prisma/client
npx prisma migrate resolve --applied 20260923112504_init     # tells Prisma this migration is already applied
npx prisma migrate resolve --applied 20260924040000_phase7_admin
npx prisma migrate dev                                       # future schema changes from here on
```

After that, the various `src/lib/**` query modules and `scripts/*.ts` can
be switched from raw `pg` queries to `@prisma/client` if you'd rather have
the generated types — the query logic maps over directly, table for table.

## Admin

```bash
npm run db:seed-admin -- --email=you@example.com --password=changeme12
```

Then visit `/admin/login`. Sessions last 30 days (httpOnly cookie); log
out clears it and deletes the session row. Run the seed script again with
the same email to reset a forgotten local password.

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
prisma/migrations/20260924040000_phase7_admin/migration.sql — Phase 7 admin auth + flag resolution
scripts/import-products.ts                        — CLI import script
scripts/seed-admin.ts                             — create/reset an admin login
src/lib/db.ts                                     — pg Pool helper
src/lib/slugify.ts                                — slug helper
src/lib/auth.ts                                   — password/session-token primitives (unit tested)
src/lib/admin/                                     — admin data access + session handling
src/lib/admin/actions/                             — admin Server Actions (forms post here)
.env.example                                      — DATABASE_URL template
```

## Phase 7 decisions made during implementation

Database + admin — closing the two Phase 6 gaps, then building admin
auth and product management. Flagging judgment calls for review against
the Master Plan.

**No decision came back on admin user count before this was sent**, so
this defaults to a single admin (per the Phase 7 prompt's own fallback:
"unless told otherwise"). It's implemented as a real `admin_users` table
rather than one hardcoded env-var login, though — seeding a second admin
later is one `npm run db:seed-admin` call, not a code change, so this
default doesn't lock anything in.

1. **Sessions are a real DB table (`admin_sessions`), not a signed JWT
   cookie.** A JWT can't be revoked before it expires without extra
   infrastructure (a blocklist); a DB-backed session can be deleted
   immediately on logout and is simpler to reason about for a
   single-admin tool at this scale. The cookie holds a random 32-byte
   token; only its SHA-256 hash is stored, so a database read alone
   can't be replayed as a valid session, the same reasoning as storing
   a password hash instead of the password.

2. **Passwords use `bcryptjs`, not `bcrypt`.** The native `bcrypt`
   package needs a compiled binary; `bcryptjs` is a pure-JS
   implementation of the same algorithm with no native build step,
   which matters for portability across whatever machine/CI ends up
   building this (this sandbox included).

3. **`/admin` is a second, separate root layout, not nested inside the
   customer site's layout.** Next.js only allows one `<html>`/`<body>`
   pair per render tree, so giving admin its own meant moving every
   existing customer-facing route into a `(site)` route group with its
   own root layout, and giving `/admin` a sibling root layout with no
   `SiteHeader`/`SiteFooter`/organization JSON-LD and a blanket
   `noindex`. URLs are unchanged — `(site)` is a route group, not a URL
   segment. `/admin` is also now explicitly disallowed in `robots.ts`
   as a second layer, on top of the noindex meta tag and the fact that
   nothing under it renders without a valid session anyway.

4. **Route protection is a DB-backed check in a layout, not
   `middleware.ts`.** Next.js Middleware runs on the Edge runtime by
   default, and the `pg` driver this project uses throughout needs a
   real TCP connection that Edge can't make. Rather than mixing in a
   second database client just for Edge, `requireAdminSession()` runs
   in `src/app/admin/(protected)/layout.tsx` — a Server Component,
   Node.js runtime, same `pg` pool as everywhere else — and every route
   nested under that one layout is covered by the single check. Server
   Actions also call `requireAdminSession()` themselves, since an
   action's server-side code path doesn't run through the page's
   layout tree.

5. **Verification flags gained a separate `resolutionNote` /
   `resolvedAt`, rather than reusing the existing `note` column.** The
   Phase 1 import script writes `note` as the issue description
   (e.g. which rows had conflicting prices); letting the admin's
   "mark resolved, add a note" flow overwrite that would destroy the
   original context the flag exists to preserve.

6. **`stockist_rate` is on the variant edit form, clearly labeled
   internal-only, but never on the product list table** — per the
   Master Plan's explicit instruction. The list table doesn't show any
   per-variant price at all (retail included), since a product can have
   several variants at different prices; only the edit form, scoped to
   one variant at a time, is the right place for exact figures.

7. **Product images are saved to local disk** (`public/uploads/products/
   <id>/…`), not an object-storage bucket. Fine for one admin and a
   ~80-product catalogue on a single deployment; worth revisiting if
   this ever moves to a multi-instance host where the filesystem isn't
   shared, or once photos actually need to be sourced at volume.

8. **No bulk CSV re-import button in the admin**, matching the Master
   Plan's own "nice-to-have, not necessary" note — `npm run
   import:products` from the command line already does this and wasn't
   worth re-building as a form-and-file-upload flow this phase.

9. **No success/flash-message system.** Every mutation redirects back to
   the page it came from, which is enough feedback (the new value is
   just there) without building a toast/banner mechanism this phase.

10. **Vitest is pinned to v2, not the latest v4/v5.** `npm install`
    with the newest vitest hit a real bug in npm's dependency resolver
    (`Cannot read properties of null (reading 'edgesOut')`) triggered by
    vitest's optional peer dependencies, reproducible in this sandbox
    even with `--legacy-peer-deps`. v2 installs cleanly and is more than
    sufficient for the handful of pure-function tests this phase needed;
    revisit the version once `npm install vitest@latest` works cleanly
    in your environment.

11. **Prettier's `printWidth` is 88, not the 80 default.** Matches the
    line lengths already common across the Phase 1–5 codebase more
    closely than either extreme (80 or the also-common 100).

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

## Phase 5 decisions made during implementation

UI/UX design system — visual polish and reusable components only, no new
content, pages, or routes. Flagging judgment calls for review against the
Master Plan (Phase 4 skipped this section; resuming the Phase 1 pattern).

1. **Status tokens (`--success`/`--warning`/`--danger`) are deliberately
   muted, not the usual bright green/amber/red.** Picked shades that read
   as "professional/clinical" rather than "generic storefront" (matching
   `--brand`'s existing restrained navy), and verified every text/background
   pairing — including each color against its own `-tint` background —
   at ≥4.5:1 contrast (WCAG AA), in both light and dark mode. None of
   these are wired into any page yet; there's no order status, stock
   status, or form validation flow to attach them to until later phases,
   so for now they're just available tokens + the `FieldError`/`invalid`
   states on the new form components.

2. **`--brand-dark` is a _darker_ blue in light mode but a _lighter_ blue
   in dark mode.** A hover/active state needs to move away from the
   resting state in whichever direction stays visible — darkening further
   on an already-dark page would nearly disappear.

3. **A typography scale unified a few small inconsistencies that had
   crept in across Phases 2–4** rather than preserving them as separate
   cases: the "eyebrow" label style existed as both `text-xs` (ProductCard)
   and `text-sm` (brand/product-finder page headings) uppercase text —
   now always `text-xs` via `.text-eyebrow`. Page `<h1>`s now also step up
   to `text-3xl` at `sm:` and up, which none of them did before (they were
   flat `text-2xl` at every width).

4. **Button component covers both real CTAs and the sort/size filter
   chips**, via a third `active` prop rather than a fourth "toggle"
   variant — `CategoryFilterBar`'s selected/unselected chip states were
   already visually identical to `primary`/`ghost`, so this reuses the
   same three variants instead of inventing a new one for one component.

5. **Mobile nav breakpoint stays at `lg` (matches Phase 2's existing
   `hidden lg:flex` cutoff)** rather than introducing a new breakpoint.
   One side effect: the inline search box that used to show at `sm:`–`lg:`
   widths (nav hidden, search visible) is gone — below `lg` now, search
   only lives inside the hamburger panel, alongside the nav links. This
   simplifies what was a slightly awkward in-between tablet state (visible
   search, no visible nav) into two clean states: full desktop bar, or
   hamburger panel with everything in it.

6. **`CategoryFilterBar`'s mobile accordion is rendered as separate
   markup from the desktop bar (shown/hidden via `hidden sm:flex` /
   `sm:hidden`), not one `<details>` toggled with CSS.** A native
   `<details open>` state is controlled by the browser, not by
   `display: contents` — trying to force it "always open" at `sm:` and up
   with CSS alone is inconsistent across browsers, so the safer choice
   was two small render paths sharing one `FilterContent` helper.

7. **ProductCard's image block is a permanent placeholder, not a
   conditional one.** No product has a real photo yet anywhere in the
   catalogue (Phase 1 decision #6 — the importer never created any
   `ProductImage` rows), so "placeholder for missing photos" is currently
   every card, every time. The block reserves a real `aspect-[4/3]` box
   so swapping in a real `<Image>` later won't reflow the grid.

8. **Search and category-listing pages widened from `max-w-3xl` to
   `max-w-5xl`.** These are the two pages that render `ProductCard` in a
   grid (`sm:grid-cols-2 lg:grid-cols-3`); the old 3xl content width was
   sized for a single-column list of placeholder text and made a 3-column
   card grid feel cramped. Every other page (still single-column text/links)
   keeps `max-w-3xl`.

9. **Form input/label/error components exist but aren't wired into any
   flow.** No form on the site functionally submits anything yet — that's
   Phase 11. `SearchForm` was refactored to use the new `Input`/`Label`
   primitives (it's the one real `<input>` that already existed), which
   also doubles as a working example for Phase 11 to follow.

10. **`MobileNav` is the only Client Component this phase adds.**
    Everything else in the app is still a Server Component; the hamburger
    open/closed state is the one piece of UI that genuinely can't be
    server-rendered.
