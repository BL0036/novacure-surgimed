import Link from "next/link";
import { formatPrice } from "@/lib/catalog";

interface ProductCardProps {
  href: string;
  name: string;
  shortDescription?: string | null;
  minPrice: string | null;
  /** Optional eyebrow label, e.g. category name on search results. */
  eyebrow?: string;
}

// Phase 5 §5 — visual refresh only; props/data logic unchanged. The
// image block always renders as a placeholder because no product photos
// exist yet anywhere in the catalogue (Phase 1 decision #6 — no
// ProductImage rows). It becomes a real <Image> once Phase 8/9 wires
// photos in; no prop changes needed on that day; the placeholder box
// already reserves the right aspect ratio.
export function ProductCard({
  href,
  name,
  shortDescription,
  minPrice,
  eyebrow,
}: ProductCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex aspect-[4/3] shrink-0 items-center justify-center bg-brand-tint text-muted">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-9 w-9"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M21 16l-5.5-5.5L3 20" />
        </svg>
        <span className="sr-only">Product photo pending</span>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-4 py-3">
        {eyebrow ? <p className="text-eyebrow">{eyebrow}</p> : null}
        <p className="text-body font-medium text-foreground transition-colors group-hover:text-brand">
          {name}
        </p>
        {shortDescription ? (
          <p className="text-body-muted line-clamp-2">{shortDescription}</p>
        ) : null}
        <p className="mt-auto pt-2 text-sm font-semibold text-brand">
          {formatPrice(minPrice)}
        </p>
      </div>
    </Link>
  );
}
