import Link from "next/link";
import type { Metadata } from "next";
import { PRODUCT_FINDER_BODY_AREAS, PRODUCT_FINDER_DISCLAIMER } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = buildMetadata({
  title: "Product Finder",
  description: "Find the right Craftscare product category by body area.",
  path: "/product-finder",
  noIndex: true,
});

// Phase 4 §4 — a real 2-step flow: Step 1 is the body-area buttons below;
// Step 2 is simply navigating to that category's listing page (built in
// Phase 4 too), which already has its own filters/sort. No separate
// "requirement type" sub-step — see Phase 4 plan §4 for the reasoning,
// and flag if real customer usage suggests otherwise.
export default function ProductFinderPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-page-title">Product Finder</h1>

      <p className="mt-4 rounded-md border border-border bg-brand-tint px-4 py-3 text-sm text-foreground">
        {PRODUCT_FINDER_DISCLAIMER}
      </p>

      <h2 className="text-eyebrow mt-8">Where is the product for?</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PRODUCT_FINDER_BODY_AREAS.map((area) => (
          <Button
            key={area.categorySlug}
            href={`/craftscare/${area.categorySlug}`}
            variant="secondary"
            className="justify-center text-center"
          >
            {area.label}
          </Button>
        ))}
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <p className="text-body-muted">
          Looking for traction equipment, vascular products, or consumables &amp;
          equipment instead?
        </p>
        <Link
          href="/categories"
          className="mt-2 inline-block text-sm text-brand hover:underline"
        >
          Browse all categories →
        </Link>
      </div>
    </div>
  );
}
