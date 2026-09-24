import Link from "next/link";
import { buildQueryString } from "@/lib/query-string";

interface PaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
  /** Other active query params (sort, size, q) to preserve across page links. */
  otherParams?: Record<string, string | undefined>;
}

// Simple page-based pagination (not infinite scroll) — keeps results
// crawlable and works fine at Craftscare's product-count scale
// (Phase 4 plan §2).
export function Pagination({
  basePath,
  page,
  totalPages,
  otherParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (targetPage: number) =>
    `${basePath}${buildQueryString({ ...otherParams, page: targetPage === 1 ? undefined : targetPage })}`;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between text-sm"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="text-brand hover:underline">
          ← Previous
        </Link>
      ) : (
        <span className="text-muted">← Previous</span>
      )}

      <span className="text-muted">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="text-brand hover:underline">
          Next →
        </Link>
      ) : (
        <span className="text-muted">Next →</span>
      )}
    </nav>
  );
}
