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
