# NovaCure Surgimed Suppliers

Multi-brand healthcare e-commerce platform. First brand: **Craftscare**
(orthopaedic products, Nepal).

**Current scope (through Phase 8):** product master data + CSV import
(Phase 1), storefront routes/IA/SEO (Phases 2–4), UI/UX design system
(Phase 5), admin auth + product management (Phase 7 — Phase 6 was a
checkpoint, not a coding phase), and the real storefront — homepage,
category/product pages, image uploads via Vercel Blob (Phase 8). No
customer accounts, cart/checkout, verified product copy/photos, or
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
psql -d novacure_dev -f prisma/migrations/20260925030000_phase9_variant_ref_code/migration.sql
psql -d novacure_dev -f prisma/migrations/20260926050000_phase11_enquiries/migration.sql
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

## Phase 8 decisions made during implementation

Storefront — real homepage, listing/product pages, and the carried-forward
image storage fix. Flagging judgment calls for review against the Master
Plan.

1. **Image storage moved to Vercel Blob, not Cloudinary or S3.** Per the
   Phase 7 review's recommendation and Master Plan §18 (deploying on
   Vercel) — no separate account/service needed, and it drops straight
   into `saveProductImage`/`deleteProductImage` without a new SDK
   dependency graph. `ProductImage.webPath` now stores the full Blob URL
   instead of a local `/uploads/...` path; no data migration was needed
   since no real product photos existed yet (Phase 1 decision #6). Needs
   a `BLOB_READ_WRITE_TOKEN` in `.env` for local dev — see `.env.example`.

2. **`formatPrice` (and the `ProductVariantSummary`/image types it works
   with) got split out of `src/lib/catalog.ts` into a new
   `src/lib/format.ts`.** `VariantSelector` is a Client Component and
   needs `formatPrice`, but `catalog.ts` imports `./db`, which pulls in
   the `pg` package — `pg` uses Node builtins (`net`, `tls`) that don't
   exist in the browser bundle, so importing anything from `catalog.ts`
   from a Client Component fails the build. `catalog.ts` re-exports
   `formatPrice` from `format.ts` so existing Server Component callers
   (`ProductCard`, category/search pages) are unaffected.

3. **Featured and Popular merged into one homepage section** (Master Plan
   §16 items 3 & 6), per the Phase 8 plan's own recommendation — there's
   no `featured` flag and no order/sales data to meaningfully distinguish
   the two, so both would otherwise show identical "most recently updated
   published products" content under two different headings. A real
   featured-products admin toggle can be added later if manual curation
   is wanted; not built now.

4. **`getFeaturedProducts`/`getRelatedProducts` are brand/category-wide
   "recently updated" queries, explicitly documented as an honest
   placeholder for real curation/popularity signal**, matching the same
   pattern already used by `listCategoryProducts`'s sort options (no
   "popularity" sort exists there either, for the same reason).

5. **Product JSON-LD is gated on `Product.status === "published"`, not
   `publication_status === "published"`.** These are two independent
   admin-settable fields (see Phase 7 `updateProductAction`) — a product
   can be publicly visible (`publication_status = published`) while its
   own verification `status` is still `verified` or earlier. Per Phase 8
   §5, structured data only goes out once `status` itself reads
   `published`, so `getProductBySlug` selects and returns `status`
   specifically for the page to check, separately from the
   `publication_status` filter already applied in the query's `WHERE`.

6. **Product detail page's size/variant selector is display-only, not a
   cart control.** There's no ordering system yet (Phase 11), so
   `VariantSelector` is a small Client Component that swaps which
   variant's price/SKU/stock status is shown — nothing is submitted or
   added to anything.

7. **`ProductGallery` always renders the placeholder block for now.** No
   product has a real photo yet anywhere in the catalogue (same Phase 1
   decision #6 noted in the Phase 5 section below), so the "no images"
   path is the only path currently exercised. The component is written
   to also handle a real multi-image gallery (main image + thumbnail
   strip) so no changes are needed here once Phase 9 uploads real photos
   — only `next.config.ts`'s new Blob `remotePatterns` entry (added this
   phase) needed to exist ahead of time for `next/image` to accept the
   URLs.

8. **Certification badges: still not published, per Phase 5 §4 / Master
   Plan §26.** The homepage's "Trust/information" section ships generic
   copy ("quality-focused sourcing") only — no ISO/WHO-GMP/CE/MSME/FDA
   marks — with a `TODO(owner)` comment marking where they go once
   confirmed. This isn't new; it's the same hold from Phase 5, still
   open.

9. **Hero tagline, Craftscare brand blurb, and contact/WhatsApp details
   are all placeholder text with `TODO(owner)` comments**, per Phase 8
   §5/§6 — none of this content is invented. The footer already carried
   a "Contact details coming soon" placeholder from Phase 2 and needed no
   change this phase.

## Phase 8 content update

Replaced Phase 8's placeholder/TODO copy with real content from the
project owner, across two passes. Content-only — no component logic,
queries, routing, or styling structure changed.

1. **`SITE_NAME`** -> `"NovaCure SurgiMed"`, **`SITE_FULL_NAME`** ->
   `"NovaCure SurgiMed Suppliers"` (`src/lib/site.ts`) -- confirmed
   correct by the project owner. Also swept the remaining hardcoded
   `"NovaCure Surgimed Suppliers"` (old casing) occurrences in page
   metadata descriptions (search, categories, brands, shop, guides,
   for-hospitals-pharmacies, admin layout, and the (site) root layout's
   default description) to match, since those were literal strings, not
   reads of the `SITE_FULL_NAME` constant, and had been missed by the
   rename.
2. **Contact details** -- added as named constants in `src/lib/site.ts`
   (`CONTACT_ADDRESS`, `CONTACT_PHONE_DISPLAY`/`CONTACT_PHONE_TEL`,
   `CONTACT_WHATSAPP_URL`, `CONTACT_EMAIL`, `CONTACT_HOURS`) rather than
   typed inline in three places, so footer, `/contact`, and the homepage
   Contact/WhatsApp section stay in sync. `/contact` was a `ComingSoon`
   placeholder (built before Phase 8) -- replaced with a real page.
3. **Homepage hero** -- real tagline/subtext in place of the TODO.
4. **Homepage Trust/certification section** -- enabled with the six
   certifications as plain badges, worded "Craftscare products are
   manufactured under ..." per the explicit instruction that these
   belong to the Craftscare manufacturer, not to NovaCure SurgiMed as
   platform operator -- not phrased as NovaCure holding them.
5. **About NovaCure** -- real paragraph now in on `/about` and a new
   homepage "About us" section (placed right after Hero -- Master Plan
   §16 doesn't define a homepage About section's position, so this
   slots in as the natural next block before the category grid). The
   founder credit line ("Founded by Deepmala Lamichhane.") is on
   `/about` only, per the request -- not duplicated onto the homepage.
6. **Craftscare brand blurb** -- real paragraph now in on
   `/brands/craftscare` and the homepage's existing Craftscare
   brand-intro section, replacing both TODOs.

## Phase 9 (pilot) — schema + admin additions

Task 1 of the Phase 9 pilot only — the variant-level manufacturer ref
code and the size-chart JSON editor. Task 2 (applying the Lumbar Sacro
Belt's real content) is not done yet: the request referenced "the text
provided below" / "the JSON provided below" for the short/full
description, features, and both `measurementData` blocks, but that
content didn't actually come through with the request, only the
placeholder note. Nothing was written to that product to avoid
inventing copy or fabricating a size chart.

1. **`ProductVariant.manufacturerRefCode`** (nullable `TEXT`) added via
   a hand-written migration (`prisma/migrations/20260925030000_phase9_variant_ref_code/`),
   same reason as the Phase 1/7 migrations — the Prisma CLI can't reach
   `binaries.prisma.sh` from this environment. Real packaging can show a
   different ref code per size tier (e.g. Lumbar Sacro Belt: A-513 for
   S/M/L/XL, B-513 for XXL), which the old product-level-only field
   couldn't represent.
2. **Admin variant edit form** — new "Manufacturer ref code" input per
   variant. When a variant's own code is empty, the input's placeholder
   shows the product-level code and a helper line reads "Falls back to
   product code: ..." so the admin can see what a customer-facing
   fallback would show without the field silently having no value.
3. **Admin variant edit form** — new "Size chart (JSON)" textarea for
   the existing `measurementData` column, pretty-printed on load.
   Validated server-side in `updateVariantAction` *before* any write
   happens: invalid JSON redirects back with the existing `variantError`
   banner (reusing createVariantAction's duplicate-SKU error convention
   rather than adding a second error mechanism) and the variant's other
   fields are left untouched, not partially saved.

## Phase 9 (pilot) Task 2 — Lumbar Sacro Belt real content

Applied via a one-off script, `scripts/phase9-lumbar-sacro-belt.ts`
(`npm run db:phase9-lumbar-sacro-belt`), rather than by hand through the
admin UI — a script is safer for a one-time content load like this
because it's auditable, re-runnable, and refuses to guess if it finds
zero or multiple matches for the product/variants (protects the "don't
touch any other product" requirement mechanically instead of relying on
careful clicking). Runs in one transaction.

Verified against a local test database seeded to match what Phase 1's
CSV import would have left (draft product, no descriptions, two variants
by size_label, plus an unrelated second product to prove selectivity):
script ran cleanly, updated exactly the intended rows, left the other
product untouched, and a direct call to `getProductBySlug` (the same
function the storefront product page calls) confirmed the product would
render with the new status/description/features and both variants'
correct price/stock/SKU data.

**Found while verifying — flagging for a decision, not fixed here:**
`getProductBySlug`/`ProductDetail`/`ProductVariantSummary` in
`src/lib/catalog.ts` don't select or expose `manufacturerRefCode` or
`measurementData` at all, and no page (product detail, `/size-guide`)
has any UI for either. So while both variants' ref codes (A-513 for
S/M/L/XL, B-513 for XXL) and the S/M/L/XL size chart are correctly saved
in the database and visible in the admin edit form, none of it is
visible anywhere on the public site — `/size-guide` in particular is
still Phase 4's static "pending" page, unrelated to any specific
product's data. That's a content pass, not a storefront gap — this
script only applies data, it doesn't add display UI — so it's left for
a future phase/instruction rather than added unilaterally here.

## Phase 9 (pilot) Task 3 — surface variant ref code + size chart on the storefront

Closes the display gap flagged at the end of Task 2. Content-only in
effect (no product/variant data changed), but does touch code — the
public catalog query didn't expose these two columns at all before this.

1. **`catalog.ts`** — `ProductVariantSummary` gained `manufacturerRefCode`
   and `measurementData`; `getProductBySlug`'s variant query now selects
   `manufacturer_ref_code, measurement_data`, and `ProductDetail` gained
   the product-level `manufacturerRefCode` too (needed for the fallback
   in #3 below — the product query didn't select it before either).
   `measurementData` is typed `unknown`, not a fixed shape, since
   `schema.prisma` explicitly calls it free-form/varies by product type.
2. **New `SizeChart` component** (`src/components/SizeChart.tsx`) renders
   a size -> inches/cm table, but only after checking the JSON actually
   looks like `{ [size]: { in?, cm? } }` — an unexpected shape or a
   `null` (this product's XXL variant) renders nothing rather than an
   empty table or a crash. Verified directly against both the real
   S/M/L/XL data and `null` — see commit for the check.
3. **`VariantSelector`** now takes a `productManufacturerRefCode` prop
   and shows `selected.manufacturerRefCode ?? productManufacturerRefCode`
   next to the SKU line — the exact same fallback the admin form already
   uses (Phase 9 Task 1), not a second implementation of the same logic.
   The size chart renders directly below, keyed to whichever variant is
   currently selected, so switching sizes on a product with per-size
   charts would swap the table too (not exercised by this product, since
   only one of its two variants has chart data, but the component
   doesn't special-case that).
4. **`/size-guide` untouched**, per the explicit instruction — stays
   Phase 4's general per-category placeholder.

Verified against the same local seeded database as Task 2 (still has the
real Lumbar Sacro Belt data from that run): `getProductBySlug` returns
`manufacturerRefCode: "A-513"` and the full measurement object for
S/M/L/XL, and `manufacturerRefCode: "B-513"` with `measurementData: null`
for XXL — confirmed by direct query, and `SizeChart`'s shape check
confirmed to return `true` for the real S/M/L/XL object and `false` for
`null` and `{}`.

## Phase 10 — connect Product Finder and Size Guide to real content

Content-and-query work only — the Product Finder's 2-step flow, the
product-detail size chart (Phase 9 Task 3), and no product/variant data
were touched, per the request.

1. **`/size-guide` rewritten from a flat "pending" list into real
   per-category guidance.** The 8 categories the Product Finder maps to a
   body area (`PRODUCT_FINDER_BODY_AREAS` in `src/lib/site.ts`) each get
   the supplied "How to measure" paragraph — general measuring technique,
   not manufacturer data, so it doesn't run into the "don't invent
   numbers" rule Phase 4/9 followed. The other 3 categories (Traction &
   Immobilization Equipment, Vascular, Consumables & Equipment) aren't
   body-measurement products and keep the original "Measurement chart
   pending" copy unchanged.
2. **New `catalog.ts` query, `getProductsWithSizeChart(categoryId)`** —
   published products in a category with a real size chart on at least
   one variant (`measurement_data IS NOT NULL`). `/size-guide` calls it
   per category and lists the results as "See real size chart: <name>"
   links to the real product page; a category with none yet shows only
   the general guidance, no placeholder line, matching the request.
   Right now this surfaces exactly one link — the Lumbar Sacro Belt under
   Back & Lumbar/Abdominal, the only product with real `measurementData`
   (Phase 9 Task 2) — everything else still reads "pending" honestly.
3. **Each category section on `/size-guide` has `id={slug}`** (the same
   slug `/craftscare/[category]` already uses), so a category listing
   page can deep-link into its own section.
4. **Category listing pages (`/craftscare/[category]`) gained a small
   "Not sure of your size? See how to measure" link** to
   `/size-guide#<slug>`, placed just under the existing filter bar. Shown
   for all 11 categories (reachable by direct browsing, not only the 8
   Product Finder covers) rather than conditionally hidden for the 3
   without real guidance yet — it still lands on that category's
   section, which reads "pending" honestly for those three, so there's
   no broken or misleading link either way.
5. **`listCategoryProducts`'s default ordering now ranks `status =
   'verified'` products ahead of everything else** (draft included) as
   the primary sort key, with the existing name/price ordering kept as
   the secondary key inside each group — applied uniformly across all
   three sort options (name, price-asc, price-desc) rather than only the
   unsorted default, since a "verified drops behind draft when you sort
   by price" wrinkle didn't seem like an intentional part of the ask.
   `publication_status = 'published'` (the pre-existing filter) is
   unaffected — this only changes ordering among already-published rows,
   not which rows are returned.

**Verification:** `npx tsc --noEmit`, `npx eslint` on the changed files,
and the existing Vitest suite (`src/lib/auth.test.ts`) all pass. A
`next build` was attempted but fails on this sandbox's network for an
unrelated, pre-existing reason (`next/font` can't reach
`fonts.googleapis.com`, used by `src/app/admin/layout.tsx`, not touched
this phase). Runtime verification against a seeded DB — the pattern
Phase 9 used — wasn't possible here either: no local Postgres is
installed, and `apt-get install postgresql` 404s against
`security.ubuntu.com` from this sandbox. `getProductsWithSizeChart`'s
SQL was checked by hand against the same tables/columns
`getCategorySizeLabels` and `getProductBySlug` already query
successfully (`product_variants.measurement_data`, `products.slug`), and
the status-ordering `CASE` expression was checked against
`prisma/schema.prisma`'s `ProductStatus` enum. Worth a real DB smoke
test on a machine that can reach Postgres before this ships.

**No GitHub remote is configured in this checkout** (`git remote -v` is
empty) — this phase's work is committed locally only, same as it looks
like Phases 7–9 were before this zip was produced. Add a remote and
`git push` to actually get it onto GitHub.

## Phase 11 — enquiry + order system (no cart, no payment)

The entire "ordering" pipeline for this phase is a customer-submitted lead
an admin follows up on by hand (phone/WhatsApp) — no cart, no payment
integration, no customer accounts, no automated email/SMS. That scope
line shaped every decision below.

1. **New `Enquiry` model + hand-written migration**
   (`prisma/migrations/20260926050000_phase11_enquiries/`), same reason
   as every migration since Phase 1 (see "About Prisma CLI"). `productId`
   / `variantId` are nullable with `ON DELETE SET NULL`, not `CASCADE` —
   an enquiry is a customer record and should outlive the catalogue row
   it referenced if that product is later removed. Also patched a
   pre-existing gap: the Phase 9 migration was missing from this file's
   setup instructions above; added it alongside Phase 11's.
2. **Public write path is deliberately separate from admin.**
   `src/lib/enquiries.ts` (`createEnquiry`, one INSERT) and
   `src/lib/actions/enquiries.ts` (`createEnquiryAction`, the one
   `"use server"` an unauthenticated visitor can call) are new,
   parallel to but not merged into `src/lib/admin/enquiries.ts` — the
   same separation `catalog.ts` vs `admin/products.ts` already
   established, but doubly important here since this is the one path
   that writes to the database with no `requireAdminSession()` gate at
   all.
3. **`EnquiryForm` (`src/components/EnquiryForm.tsx`) is one component,
   reused as-is** on the product page (bound to a product/variant) and
   `/for-hospitals-pharmacies` (bound to nothing), with a
   `showOrganization`/`organizationLabel` prop for the latter —
   `organizationName` isn't shown at all on the product-page form, per
   the field list in the request. Built on `useActionState` rather than
   a redirecting `<form action>` (the admin pattern) so the success
   message ("Thanks — we'll contact you shortly to confirm your order.")
   renders in place instead of navigating away from the product page.
   Caught during verification: a `"use server"` file can only export
   async functions, so the shared idle-state constant had to move out of
   `actions/enquiries.ts` into the client component itself, not stay
   exported alongside the action.
4. **Product page gets both Phase 11 §2 CTAs on `VariantSelector`**
   (it already tracks the selected variant): "Order via WhatsApp" via a
   new `buildWhatsAppOrderUrl()` helper in `site.ts` (same number as
   `CONTACT_WHATSAPP_URL`, with a `?text=` pre-filled message — the
   visitor still has to hit send in WhatsApp, this never messages
   anyone on its own) including the product name, selected size, and
   full page URL; and "Request this product", a toggle that reveals
   `EnquiryForm` bound to that product/variant.
5. **`/for-hospitals-pharmacies` rewritten from the Phase 2/8
   `ComingSoon` placeholder** to real content: WhatsApp/phone/email,
   plus the same `EnquiryForm` with `organizationName` shown and
   labeled "Hospital/Pharmacy name". A full wholesale/business-account
   system (bulk pricing, credit terms, its own login) is still a later,
   separate phase, as before — this is enquiry intake only.
6. **Admin `/admin/enquiries`** (newest first, status-filter tabs) and
   `/admin/enquiries/[id]` (contact/product detail + a status-update
   form, same select-plus-submit pattern the product edit page uses).
   Nav link added; `getDashboardCounts()` gained `newEnquiries`, shown
   as a 5th card on the dashboard linking to the filtered list.

**Verification:** `npx tsc --noEmit`, `npx eslint .`, and the existing
Vitest suite all pass. Unlike Phase 10, a real local Postgres was
available this time (`apt-get install postgresql` succeeded once
`apt-get update` was re-run first — Phase 10's 404 looks like it was a
transient mirror issue, not a persistent block) — so this phase got a
genuine end-to-end pass rather than a static-only one: applied all four
migrations in order to a fresh database, seeded a brand/category/
product/variant and a real admin user, ran `next dev`, and drove it
over real HTTP — both the public enquiry submission (matched the exact
`useActionState` progressive-enhancement multipart POST a JS-disabled
browser would send, hidden fields included) and the admin status-update
form (same for its plain server-action POST) — then confirmed each
write in Postgres directly and by re-fetching the admin pages. That
first HTTP attempt at the public form is what caught the `"use server"`
export bug in point 3 above — a good reminder that `tsc`/`eslint`
passing doesn't catch everything Next.js's server-action boundary
enforces. `next build` still fails in this sandbox for the same
pre-existing, unrelated reason as Phase 10 (`next/font` can't reach
`fonts.googleapis.com`); `next dev` doesn't hit that same hard-fail
codepath, which is what made the above possible without touching
`admin/layout.tsx`'s fonts.

**No GitHub remote is configured in this checkout**, same as Phase 10 —
this phase's work is committed locally only. See that phase's note for
what's needed to actually push it.
