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
      className="block rounded-lg border border-border px-5 py-4 transition-colors hover:bg-brand-tint"
    >
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {eyebrow}
        </p>
      ) : null}
      <p className="mt-1 font-medium text-foreground">{name}</p>
      {shortDescription ? (
        <p className="mt-1 text-sm text-muted">{shortDescription}</p>
      ) : null}
      <p className="mt-2 text-sm text-brand">{formatPrice(minPrice)}</p>
    </Link>
  );
}
