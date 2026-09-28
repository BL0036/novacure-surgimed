import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  href: string;
  name: string;
  shortDescription?: string | null;
  minPrice: string | null;
  /** Optional eyebrow label, e.g. category name on search results. */
  eyebrow?: string;
  /** Primary product photo. When absent the placeholder block shows. */
  image?: { src: string; alt?: string | null } | null;
}

// Phase 5 §5 introduced the card; the visual upgrade wires in real photos.
// When a product has a primary photo it renders with next/image (lazy by
// default) inside the same 4:3 box the placeholder used, so cards never
// change height between photo / no-photo. Alt text is the photo's own alt
// text, falling back to the product name. With no photo, the original
// placeholder shows — unchanged.
export function ProductCard({
  href,
  name,
  shortDescription,
  minPrice,
  eyebrow,
  image,
}: ProductCardProps) {
  return (
    <Link
      href={href}
      className="card-surface card-interactive group flex h-full flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {image ? (
        <div className="relative aspect-[4/3] shrink-0 bg-white">
          <Image
            src={image.src}
            alt={image.alt || name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-3"
          />
        </div>
      ) : (
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
      )}

      <div className="flex flex-1 flex-col gap-1 px-4 py-3">
        {eyebrow ? <p className="text-eyebrow">{eyebrow}</p> : null}
        <p className="text-body font-medium text-foreground transition-colors group-hover:text-link">
          {name}
        </p>
        {shortDescription ? (
          <p className="text-body-muted line-clamp-2">{shortDescription}</p>
        ) : null}
        <p className="mt-auto pt-2 text-sm font-semibold text-link">
          {formatPrice(minPrice)}
        </p>
      </div>
    </Link>
  );
}
