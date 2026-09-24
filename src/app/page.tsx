import Link from "next/link";
import { BRANDS, SITE_FULL_NAME } from "@/lib/site";

// Phase 2 placeholder home page — structure and nav only, no invented
// marketing copy. Real homepage content/design is Phase 5+.
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <p className="text-sm font-medium text-brand">{SITE_FULL_NAME}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Home — content coming soon
      </h1>
      <p className="mt-3 text-sm text-muted">
        This is a Phase 2 placeholder. Final homepage design and content are
        built in later phases.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/shop"
          className="rounded-md bg-brand px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
        >
          Browse Shop
        </Link>
        <Link
          href="/brands"
          className="rounded-md border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-brand-tint"
        >
          View Brands
        </Link>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-wide text-muted">
          Brands currently carried
        </p>
        <ul className="mt-2 text-sm">
          {BRANDS.map((brand) => (
            <li key={brand.slug}>
              <Link
                href={`/brands/${brand.slug}`}
                className="text-brand hover:underline"
              >
                {brand.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
