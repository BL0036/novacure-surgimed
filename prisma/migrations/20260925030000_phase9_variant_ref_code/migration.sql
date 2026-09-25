-- Phase 9 — variant-level manufacturer ref code.
-- Hand-written to match prisma/schema.prisma, same reason as the Phase 1
-- and Phase 7 migrations (see README "About Prisma CLI"): the Prisma CLI
-- can't reach binaries.prisma.sh from this environment.

-- AlterTable: product_variants gets an optional ref code that overrides
-- the product-level one for that size tier (e.g. Lumbar Sacro Belt:
-- A-513 for S/M/L/XL, B-513 for XXL — one product-level code can't
-- represent both).
ALTER TABLE "product_variants" ADD COLUMN "manufacturer_ref_code" TEXT;
