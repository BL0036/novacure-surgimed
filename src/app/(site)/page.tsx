import Link from "next/link";
import { BRANDS, SITE_FULL_NAME } from "@/lib/site";
import { Button } from "@/components/ui/Button";

// Phase 2 placeholder home page — structure and nav only, no invented
// marketing copy. Real homepage content is still later phases; Phase 5
// only applies the shared typography scale and Button component.
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <p className="text-sm font-medium text-brand">{SITE_FULL_NAME}</p>
      <h1 className="text-page-title mt-2">Home — content coming soon</h1>
      <p className="text-body-muted mt-3">
        This is a Phase 2 placeholder. Final homepage design and content are built in
        later phases.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/shop" variant="primary">
          Browse Shop
        </Button>
        <Button href="/brands" variant="secondary">
          View Brands
        </Button>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <p className="text-eyebrow">Brands currently carried</p>
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
