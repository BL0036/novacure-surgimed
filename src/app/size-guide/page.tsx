import Link from "next/link";
import type { Metadata } from "next";
import { CRAFTSCARE_CATEGORIES } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Size Guide",
  description: "General sizing guidance by category.",
  path: "/size-guide",
  noIndex: true,
});

// Phase 4 §5 — one entry per category (not per product), since no real
// measurement charts exist yet for any product (Phase 1 finding). Each
// entry is honestly marked "pending" rather than inventing cm/inch
// numbers — filling in placeholder figures here would violate the same
// "don't invent missing info" rule Phase 1 followed for the catalogue.
export default function SizeGuidePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-page-title">Size Guide</h1>
      <p className="text-body-muted mt-3">
        General sizing guidance by category. Measurement charts are added
        once confirmed with the manufacturer — none are invented here.
      </p>

      <div className="mt-8 divide-y divide-border border-y border-border">
        {CRAFTSCARE_CATEGORIES.map((category) => {
          const slug = slugify(category);
          return (
            <div key={category} className="flex items-center justify-between py-4">
              <div>
                <p className="text-body font-medium">{category}</p>
                <p className="text-body-muted mt-1">
                  Measurement chart pending — will be added once confirmed
                  with the manufacturer.
                </p>
              </div>
              <Link
                href={`/craftscare/${slug}`}
                className="rounded-sm shrink-0 text-sm text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                View products →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
