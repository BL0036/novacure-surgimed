// Split out of catalog.ts so Client Components (e.g. VariantSelector) can
// import formatPrice without pulling in catalog.ts's `pg`/getPool()
// import chain, which fails to bundle for the browser (Node-only
// builtins like `net`/`tls`). catalog.ts re-exports this for existing
// Server Component callers, so there's one implementation either way.

/** Formats a decimal-string price (or null) as NPR display text.
 *  Never invents a number — a missing price shows as "Price on request". */
export function formatPrice(minPrice: string | null): string {
  if (minPrice === null) return "Price on request";
  const value = Number(minPrice);
  if (Number.isNaN(value)) return "Price on request";
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

// Phase 9 §1 / Phase 13 §6 — the variant-falls-back-to-product ref-code
// rule, extracted into its own function (previously inlined directly in
// VariantSelector's JSX as `selected.manufacturerRefCode ??
// productManufacturerRefCode`) so it can be unit tested on its own
// without rendering the component. Behavior is unchanged — same rule,
// just named and testable. Lives here (not catalog.ts) for the same
// reason formatPrice does: a Client Component needs to import it
// without pulling in catalog.ts's pg/getPool() chain.
export function resolveVariantRefCode(
  variantRefCode: string | null,
  productRefCode: string | null,
): string | null {
  return variantRefCode ?? productRefCode;
}
