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

## Phase 12 — SEO + performance finishing pass

Phase 3 had already built most of the metadata plumbing (`buildMetadata()`
already set canonical URLs and OG/Twitter fields, on every page — every
page already called it). What this phase actually found missing, after
auditing rather than assuming: no `metadataBase`, no default `og:image`
(so most pages shipped *no* image at all), no revalidation strategy, and
— found during the audit, not just "confirmed" — a sitemap that had
never actually been wired up to real product data despite a comment
claiming it would be.

1. **`metadataBase` added to `(site)/layout.tsx`** (the site's root
   layout; `admin/layout.tsx` is its own separate root per Phase 7 and is
   noindex/never shared, so it's out of scope here). Alongside it,
   `SITE_URL`'s fallback in `src/lib/seo.ts` changed from
   `https://www.novacure.com.np` to a deliberately-fake
   `https://novacuresurgimed.example.com` with a `TODO(production)`
   comment. Nothing in this project's history — no README decision, no
   Phase 3 section (Phase 3 predates the "Phase N decisions" pattern) —
   ever confirms `novacure.com.np` as an actual chosen domain; it read as
   a real domain but was, as far as this codebase's paper trail shows,
   a Phase 3 placeholder. That's exactly the trap the request's own
   wording was guarding against, so it's fixed the same way the request
   asked for: an unmistakable placeholder, not a plausible-looking guess.
   Documented in `.env.example` (`NEXT_PUBLIC_SITE_URL`, previously
   undocumented there even though `seo.ts` already read it).
2. **Every page now gets an `og:image`.** `buildMetadata()` gained a
   site-wide `DEFAULT_OG_IMAGE` (the real `public/brand/novacure-logo.png`,
   1254×1254 — not a fabricated asset) used whenever a page doesn't pass
   its own `image`. The product page's `generateMetadata` now passes the
   product's own real photo (`product.images[0]`, already ordered
   primary-first by `getProductBySlug`) when one exists, with its real
   alt text; when a product has no photo yet, it falls through to the
   same default logo like every other page — never a fabricated
   product-specific image, per the request.
3. **Revalidation:** `export const revalidate = 300` on the category page
   (`craftscare/[category]`) and product page (`craftscare/[category]/
   [product]`); `= 3600` on About, Contact, Size Guide, and For Hospitals
   & Pharmacies, as specified. Two things worth being upfront about
   rather than glossing over:
   - The category page reads `searchParams` (sort/size/page), which
     Next's own docs confirm opts the whole page into per-request dynamic
     rendering — so `revalidate = 300` is a no-op for any visit that
     includes a sort/size/page query string. It still governs the plain
     URL (what the sitemap and every nav link point to). Making
     filtered/sorted views themselves ISR-cacheable would mean
     restructuring how filtering works — out of scope for a caching
     pass, not something to fix quietly by leaving the setting off.
   - The homepage isn't named in either bucket in the request (it lists
     "product and category pages" and four specific static pages). It
     got `revalidate = 300` anyway, as a judgment call: it live-queries
     featured products the same way the category/product pages do, so
     treating it as "static" would under-cache exactly the part of it
     that actually changes.
   - Confirmed (not assumed) that admin pages need no change:
     `requireAdminSession()` calls `cookies()` on every protected admin
     page, which is itself a Request-time API that forces dynamic
     rendering — they were already correctly dynamic/uncached before
     this phase touched anything.
4. **`next/image` audit:** all three existing usages
   (`SiteHeader`'s logo, `ProductGallery`'s main + thumbnail images, the
   admin product-edit page's image list) already had either explicit
   `width`/`height` or a `fill` inside an explicitly-sized container
   (`aspect-square w-full`, `h-16 w-16`, etc.) — nothing to fix. Note:
   `ProductCard` (category listings, search, homepage) has no
   `next/image` at all — it's a Phase 5 stub that always renders a
   placeholder SVG regardless of whether a product has a real photo, per
   its own comment ("becomes a real `<Image>` once Phase 8/9 wires
   photos in"), which never actually happened. That's a real content
   gap, but it's not a `next/image` misuse (there's no `<Image>` there
   to audit), and wiring it up would mean touching the image
   pipeline/display layer beyond a caching-and-metadata pass — flagged
   here rather than fixed, per the "don't rebuild the image pipeline"
   instruction for this phase.
5. **Sitemap: found broken, not just confirmed.** Despite a comment
   claiming `sitemap.ts` would "automatically extend" once real products
   existed, it only ever listed static/category-shell routes — zero
   individual product URLs, even now that Phase 9-11 put real published
   products in the database. Added `listPublishedProductsForSitemap()`
   to `catalog.ts` and made `sitemap()` async, querying real
   `publication_status = 'published'` products with each product's own
   `updated_at` as `lastModified` (not `now()`, unlike the static
   routes, since there's a real per-row timestamp to use here). Verified
   against real data: both a photo-having and a photo-less test product
   showed up correctly at `/sitemap.xml` with the right URLs.

**Verification:** `npx tsc --noEmit`, `npx eslint .`, and the existing
Vitest suite all pass. Local Postgres (still set up from Phase 11's
session) let this get real end-to-end confirmation again: seeded two
published test products — one with a real `product_images` row pointing
at a fake-but-remotePattern-matching Blob URL, one without — plus the
category they needed, ran `next dev`, and fetched real pages over HTTP.
Confirmed by reading the actual response HTML: the photo-having product's
`og:image`/`twitter:image` is that photo's own URL with its real alt
text; the photo-less product, the category page, the homepage, and
Size Guide all fall back to the default logo with correct
`og:image:width`/`height`/`alt`; every canonical/`og:url` uses the new
placeholder domain; `/sitemap.xml` lists both real product URLs with
correct `<loc>`; `/robots.txt` still points its `Sitemap:` line at the
new domain. No `metadataBase` warning appeared in the dev server log
(it would have, pre-Phase-12, the first time a relative/absolute image
URL got resolved without one).

What couldn't be verified: actual ISR/Full-Route-Cache response headers.
`next dev` always renders on-demand with `Cache-Control: no-cache,
must-revalidate` regardless of `revalidate` config — that's documented
Next.js dev behavior, not a bug — and `next build` still fails in this
sandbox for the same pre-existing, unrelated reason as Phases 10-11
(`next/font` can't reach `fonts.googleapis.com` from `admin/layout.tsx`,
which this phase didn't touch). The `revalidate` exports are confirmed
correct by Next's own route-segment-config docs (a statically-analyzable
number literal, the only form it accepts) and by code review, not by a
live production cache header — worth a real `next build && next start`
check on a machine that can reach Google Fonts before this ships.

**No GitHub remote is configured in this checkout** — still true, this
is the third phase running with local-only commits. See Phase 10's note
for what pushing it actually needs (a remote URL and, most likely,
credentials); nothing in this project's files names one, so this can't
be resolved from inside a coding session — it needs the actual GitHub
repo URL (and how to authenticate to it) from whoever owns the project.

## Phase 13 — security + testing hardening

**1. Admin login rate-limiting.** A DB table
(`admin_login_attempts`, migration `20260926120000_phase13_security`),
not an in-memory store — this app already runs one process against a
shared Postgres, and an in-memory map would reset on every
restart/redeploy and wouldn't be shared if this ever scales to more than
one instance, defeating the point of remembering recent failures. 5
failed attempts for the same email+IP pair within 15 minutes locks that
pair out for 15 minutes, measured from the *most recent* failure (so a
bot that keeps retrying during the cooldown stays locked out rather than
"burning through" it — documented as deliberate in
`src/lib/rate-limit.ts`). The actual lockout math
(`checkLoginLockout`) is split into its own DB-free file so it's unit
tested directly (11 tests) rather than only indirectly through a real
login attempt; `src/lib/admin/login-attempts.ts` is the thin DB-backed
layer around it (fails open on a DB error — a transient outage degrades
to "no rate limiting," not "every admin locked out"). Client IP comes
from `x-forwarded-for`/`x-real-ip`, falling back to a fixed string if
neither is present. The login page shows a specific "try again in ~N
minutes" message for a lockout (not the generic wrong-password message)
since, unlike account enumeration, there's nothing sensitive about
telling the person in front of the lockout that they're locked out.

**2. Enquiry form spam protection.** Two independent checks, both in
`src/lib/enquiry-validation.ts` (`isSpamSubmission`, DB-free, unit
tested — 19 tests total in that file): a honeypot field
(`companyWebsite`, visually hidden off-canvas — not `display:none`,
since some bots specifically skip fields hidden that way — out of the
tab order and `aria-hidden`, so it's invisible to keyboard/AT users too)
and a minimum-2-second time-to-submit check. Either one tripping makes
`createEnquiryAction` return the exact same `{status: "success"}` a
genuine submission gets, without writing anything to the database — a
bot has no differently-worded error to learn from either way. The
timing check needed more thought than it looks: the render timestamp has
to be baked into the initial HTML (not set by client JS after the fact),
because this form's `useActionState` submission already works without
JS via React's normal progressive-enhancement POST, and a no-JS visitor
needs that field populated too. For the product-page form (only ever
mounted client-side, after the "Request this product" toggle) that's
just `Date.now()` at mount. For the always-rendered
`/for-hospitals-pharmacies` form, the timestamp comes from a `Server
Component` prop (`renderedAt={Date.now()}` in that page) — but that page
is ISR-cached (`revalidate = 3600`), so a naive per-request timestamp
would actually be frozen at last regeneration and could be up to an hour
stale, making the timing check trivially pass for a bot hitting the
cached page. `EnquiryForm` corrects for this with a one-time
`useEffect` that re-anchors to the browser's real clock after mount —
a no-JS submission can't benefit from that correction and just uses the
(safely-stale-in-one-direction-only) server value, so this is a
security improvement for JS-enabled visitors, not something correctness
depends on. Both of these impurity points (`Date.now()` in a Server
Component's render, `setState` in an effect) needed a documented
`eslint-disable-next-line` — this repo's `react-hooks` rules flag both
as impure/anti-patterns by default; the disables explain why each one
is a deliberate, safe exception rather than removing the lint coverage
for the file.

**3. Admin image upload validation**, in `src/lib/admin/images.ts`,
before the file ever reaches Vercel Blob: a content-type allowlist
(JPEG/PNG/WebP only — replacing the old "starts with `image/`" check,
which would have also accepted e.g. `image/svg+xml` or `image/gif`) with
a specific error message, and an 8MB size cap.

**4. Raw-query audit — result: already clean, nothing to fix.** There
is no `$queryRaw`/`$executeRaw` anywhere in this codebase — this project
uses `pg` directly at runtime, not `@prisma/client` (see the "Why raw pg
instead of `@prisma/client`" note above), so the actual audit was of
every `pool.query()` call site instead (~30 across `catalog.ts`,
`admin/products.ts`, `admin/enquiries.ts`, `admin/images.ts`,
`enquiries.ts`, `verification-flags.ts`, `dashboard.ts`, and the
session/auth files). Every one uses `$1`/`$2`-style parameterization.
The handful of dynamically-built `WHERE`/`ORDER BY` fragments (sort
order, size-label filter) are assembled from hardcoded SQL fragment
strings selected by a value already checked against a small allowlist
before it reaches the query builder (e.g. category page `sort` is
validated against `["featured", "price-asc", "price-desc"]` at the page
level) — never by concatenating a raw user string into the query.

**5. `not-found`/`error` pages, site-wide and for admin.** This app has
two separate root layouts ((site) and admin, each with their own
`<html>/<body>` — see Phase 7's note), so there's no single root layout
to hang a global 404 off of the usual way. Turned on Next 16's
experimental `global-not-found.js` (`next.config.ts`
`experimental.globalNotFound`) for exactly this case:
`app/global-not-found.tsx` is a fully self-contained page (own
`html`/`body`/fonts/`globals.css` import) that handles any URL matching
neither segment. Verified live it's actually reachable this way — an
arbitrary `/admin/some-bogus-path` with no matching page anywhere under
`/admin` falls through to this file, not to a segment-level one, since
no admin layout ever mounted to hang a nearer boundary off of.
`(site)/not-found.tsx` and `admin/not-found.tsx` handle `notFound()`
thrown *from inside* a page that did match (an unknown product/category
slug on the storefront; an unknown product/enquiry id in admin) — these
render wrapped by that segment's already-rendered layout, confirmed live
by logging in and hitting a bogus admin product id: the response shows
the real admin nav (Dashboard/Log out visible), not a bare page, because
`(protected)/layout.tsx`'s auth check had already succeeded before the
page itself threw. `(site)/error.tsx` and `admin/error.tsx` are
Client Component error boundaries for each segment (this Next version
renamed the reset callback from `reset` to `retry` — checked
`node_modules/next/dist/docs/.../10-error-handling.md` directly per
`AGENTS.md`'s instruction, since this was a real breaking change from
what training data would assume); `global-error.tsx` is a last-resort,
self-contained fallback for a failure in one of the two root layouts
themselves, which a segment's own `error.tsx` can't catch. None of the
three error boundaries ever render `error.message` or `error.digest` —
only `console.error(error)` — since a Client Component error (unlike a
Server Component one) still carries its real message in production, and
the only way to guarantee nothing internal reaches a visitor is to never
print any part of `error` in the UI at all.

**6. Vitest expansion** — 51 new tests across 4 new files (61 total,
up from 10): `rate-limit.test.ts` (11), `enquiry-validation.test.ts`
(19, covers both the pre-existing required-fields/quantity-parsing logic
now extracted into `src/lib/enquiry-validation.ts`, and the new spam
checks), `SizeChart.test.ts` (14, `isSizeChartData` exported for this
purpose — good/partial/malformed `measurementData` shapes), and
`format.test.ts` (7, covers the pre-existing untested `formatPrice` plus
the newly-extracted `resolveVariantRefCode`, pulled out of
`VariantSelector`'s JSX into its own function specifically so it's
testable without rendering the component — placed in `format.ts`, not
`catalog.ts`, for the same reason `formatPrice` already lived there:
`catalog.ts` imports `pg`/`getPool()`, which doesn't bundle for a Client
Component). All 61 pass.

**7. Playwright smoke test** — `e2e/enquiry-and-admin.spec.ts` (new
`playwright.config.ts`, `@playwright/test` installed), covering both
requested flows: browse a category → product → submit enquiry → appears
in `/admin/enquiries`; and admin login → edit a product (short
description, reverted after — see "don't change product data") → log
out. Discovers real seeded content (first category, first product)
rather than hardcoding catalogue-specific names/slugs. **Known
limitation, disclosed rather than silently left broken:**
`@playwright/test` is installed and the spec/config type-check and lint
cleanly, but this test has **not actually been run** in this sandbox —
Playwright's browser binaries download from
`playwright.azureedge.net`/`cdn.playwright.dev`, which are outside this
project's network egress allowlist, so `npx playwright install` cannot
complete here. See `e2e/README.md` for prerequisites (seeded admin,
`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`) and run it once in a normal dev
environment or CI before trusting it the way this phase's green Vitest
run can be trusted.

**8. Accessibility audit.** Labels: every form field project-wide
already used a real `<label htmlFor>`/`id` pair (`FormField.tsx`) —
nothing to fix. Alt text: all three `next/image` usages
(`SiteHeader`'s logo, `ProductGallery`'s main + thumbnail images, the
admin product-edit image list) were already correct, including
`ProductGallery`'s thumbnails' intentional `alt=""` — each thumbnail is
a `<button aria-label="Show image N of M">` wrapping a decorative image,
so the accessible name comes from the button, not the image; giving the
image its own alt text too would have doubled the announcement for a
screen reader user. Real gap found and fixed: `MobileNav` had no
keyboard way to dismiss the open panel short of tabbing through every
link inside it — added an `Escape`-closes-and-returns-focus handler,
the way a native disclosure widget behaves.

**9. Internal link crawl — result: no dead links found.** Traced every
`href` in `SiteHeader`/`MobileNav`'s nav, `SiteFooter`, breadcrumbs
(category/product pages), and cross-links (search results, size guide
anchors, brand/category pages) against the actual route tree. Every
static nav/footer link (`/shop`, `/brands`, `/categories`, `/guides`,
`/for-hospitals-pharmacies`, `/about`, `/contact`, `/product-finder`,
`/size-guide`) has a matching page. Dynamic links checked against their
actual value sources: category `sort` params against the validated
allowlist (see §4 above), `/size-guide#${slug}` anchors against real
`id={slug}` elements on that page, `/brands/${slug}`/`/categories/${slug}`
against real brand/category slugs. One fragile-but-currently-working
pattern flagged rather than "fixed" (nothing is actually broken today):
the search-results page links to
`/${product.brandSlug}/${product.categorySlug}/${product.slug}`, which
only resolves correctly today because the one existing brand's slug
literally is `"craftscare"`, matching the hardcoded
`/craftscare/[category]/[product]` route segment — this will silently
break the day a second brand is added with a URL structure of its own,
worth a second look whenever multi-brand routing actually happens
(nothing to do about it now without touching the (multi-brand-agnostic)
route structure itself, out of scope for this phase).

**10. Explicitly not done, per this phase's instructions:** no
third-party CAPTCHA integration; no product/content data changed (the
Playwright product-edit test reverts its own change; the honeypot/CSV
audit work didn't touch any real catalogue row); no new customer-facing
features.

**Verification:** `npx tsc --noEmit`, `npx eslint .`, `npx prettier
--check` (only on files this phase touched — pre-existing formatting
drift in untouched files was left alone, not "fixed" as a side effect),
and the full Vitest suite all pass (61/61). Installed Postgres 16 and
ran every migration (including the new one) against a real local
database; seeded a brand, an admin user, and one test product/variant;
ran `next dev` and confirmed against real HTTP responses: the new
product genuinely didn't show on its category page until its
`publication_status` was set to `published` (a separate admin workflow
column from the CSV-imported `status`, confirmed by reading the schema —
not a bug, just a real gotcha worth noting for future manual testing);
`global-not-found.tsx` renders for a genuinely unmatched
`/admin/some-bogus-path` (confirmed by reading the raw HTML — title,
`<h1>`, the "Go to homepage" link, `noindex` meta); `(site)/not-found.tsx`
renders (with header/footer) for an invalid category slug;
`admin/not-found.tsx` renders correctly in both states — redirecting to
login when unauthenticated (verified the real `NEXT_REDIRECT;replace;
/admin/login;307` in the dev-mode response), and, after a real login via
a hand-constructed multipart POST reproducing React's Server Action
form-submission protocol (extracting the `$ACTION_ID`/`$ACTION_REF`/
`$ACTION_KEY` hidden fields from the real rendered login form — session
cookie confirmed via `Set-Cookie: admin_session=...`), showing the real
admin nav around the not-found content for a bogus product id.
`for-hospitals-pharmacies` confirmed to render the honeypot field and a
real baked-in `formRenderedAt` timestamp in its initial HTML. **What
couldn't be confirmed live:** a full curl-reconstructed submission of
the honeypot/timing-rejected and legitimate enquiry paths through to the
database — the dev server (Turbopack) repeatedly hit a JS heap
out-of-memory crash in this sandbox after a number of rapid
restarts/requests, independent of anything in this phase's code (same
symptom with a freshly cleared `.next` cache and a brand-new process).
Given the time already spent chasing this environment issue, the spam
logic's correctness rests on `isSpamSubmission`'s 19 direct unit tests
(every branch: honeypot filled, too-fast timing, the exact
`MIN_SUBMIT_TIME_MS` boundary, a missing/unparseable timestamp, clock
skew) plus code review of `createEnquiryAction`'s wiring (spam check
runs first, returns the identical success state, never reaches
`createEnquiry`), rather than an additional live database check — worth
a real click-through on a machine that doesn't hit this crash before
Phase 14. `next build` still fails in this sandbox for the same
pre-existing, unrelated reason as Phases 10–12 (`next/font` can't reach
`fonts.googleapis.com`); confirmed this phase's new files
(`global-not-found.tsx`, `global-error.tsx`) don't introduce a *new*
failure by checking the build log names the same two pre-existing
`(site)/layout.tsx`/`admin/layout.tsx` font imports as the cause, not
anything new.


## Visual upgrade decisions

A styling/layout pass on the live storefront. **No copy, product data,
database or migration changes**, no new pages, no new animation (only
hover/focus transitions), no stock photography, no new dependencies.

**Centering / alignment (root cause).** The homepage containers were in
fact centered (`mx-auto max-w-6xl`); the "pinned left, empty right"
impression came from single-column text capped at `max-w-xl`/`max-w-2xl`
inside that container, with nothing beside it, on a page where every
section was white on white. Underneath that, each area hand-wrote its own
container classes: `max-w-6xl` on the header/footer/homepage, `max-w-5xl`
on category/product/search, `max-w-3xl` on every text page — so edges
never lined up between pages. Fix at the source: two shared utilities in
`globals.css` — `.page-container` (`max-w-7xl`, responsive padding) for
the header, footer, homepage, category/product/search, and
`.page-container-narrow` (`max-w-3xl`, still centered) for long-form text
pages — applied everywhere instead of per-section classes. Verified
centered with no horizontal overflow at 1920, 1440, 1024 and 390px.

**Hero.** New `components/Hero.tsx`: dark navy gradient derived from the
`--brand` hue (not pure black) with one soft radial glow; white 4xl→5xl→
3.5rem headline; two-column on `lg+`, image stacks below text on mobile.
Buttons use new `inverse` / `inverseOutline` variants with white focus
rings. The real Craftscare photo goes in `HERO_IMAGE` in `lib/site.ts`
(`next/image`, `priority`, explicit width/height, alt text). Until it is
supplied (`null`), a dashed, clearly-labelled "Craftscare product photo —
coming soon" placeholder shows; nothing borrowed or stock is used. The old
WordPress site was used as a mood reference only.

**Trust row** (`HERO_TRUST_POINTS` in `lib/site.ts`), each line restating
existing site facts: "Serving hospitals & pharmacies across Nepal" (hero
tagline + Hospitals & pharmacies section); "Craftscare distributor in
Nepal" (Craftscare brand section: "distributed in Nepal by NovaCure
SurgiMed" — deliberately *not* "Authorized", which the site never claims);
"Manufactured under ISO 9001, WHO-GMP & CE standards" (Craftscare brand
section / certifications list). The third line is a shortened form of the
existing certification list — owner to approve wording.

**Category tiles.** Eleven inline SVG line icons (`CategoryIcon.tsx`, one
24×24 grid, 1.5 stroke, round caps, no fill) — drawn inline rather than
adding an icon library. `aria-hidden`; the text label remains the
accessible name. Hover lifts the tile and inverts the icon chip; the
existing focus ring is kept. A zero-width space after "/" lets
"Lumbar/Abdominal" wrap on narrow tiles without changing the label.

**Rhythm and cards.** Sections alternate white / `--surface`; shared
vertical spacing via `.section-y`; `.card-surface` (border + light shadow)
and `.card-interactive` (hover lift) are used by tiles, product cards and
the CTA/contact blocks. The homepage's bordered CTA blocks became
side-by-side cards on `sm+`.

**Product card photos.** `ProductCard` takes an optional `image`. All four
card queries in `catalog.ts` (category listing, search, related, featured)
now select the product's primary photo (`type = 'primary'` first, else the
oldest `available` photo; same availability rule as the product gallery)
via one shared SQL fragment. With a photo: `next/image` (`fill`, lazy,
`object-contain` in the same 4:3 box, alt = the photo's alt text, falling
back to the product name). Without: the original placeholder, so cards do
not change height. `next.config.ts` already allowed
`*.public.blob.vercel-storage.com`; verified, unchanged. Category and
search grids gain a 4th column at `xl` now that the container is wider.

**Dark mode.** Added `--surface`, `--icon`, `--link`, shadow tokens, dark
overrides. Found and fixed an existing contrast failure: `--brand`
(#0029ba) as *text* on the dark background is 1.9:1 (fails WCAG AA). New
`--link` token = `--brand` in light mode (unchanged) and #8fa3ff in dark
(≈8:1); all 32 `text-brand` usages now use `text-link`. Hero pairs
(measured): white on `--hero-to` 14.7:1, `--hero-muted` 9.9:1 (7.3:1 at the
brightest part of the glow); muted text on `--surface` 5.6:1 light /
7.3:1 dark.

**Verification.** `tsc --noEmit` clean, `eslint .` clean, Vitest 61/61,
`next build` completes (45/45 pages). The build was run in the sandbox with
`next/font` temporarily stubbed (Google Fonts is unreachable there); the
stub was reverted and is not in the commit. Visual checks were done with a
headless browser against a local database.
