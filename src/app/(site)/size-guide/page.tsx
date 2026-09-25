import Link from "next/link";
import type { Metadata } from "next";
import { CRAFTSCARE_CATEGORIES } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { buildMetadata } from "@/lib/seo";
import { getCategoryBySlug, getProductsWithSizeChart } from "@/lib/catalog";

export const metadata: Metadata = buildMetadata({
  title: "Size Guide",
  description: "General sizing guidance by category.",
  path: "/size-guide",
  noIndex: true,
});

// Phase 10 §1 — generic measuring technique per category, as supplied
// with the Phase 10 request. This is how-to-measure guidance (a soft
// tape measure and where to hold it), not a manufacturer size chart, so
// it doesn't run into the "don't invent numbers" rule Phase 4/9 followed
// — there are no invented cm/inch figures here. Keyed by the exact
// CRAFTSCARE_CATEGORIES name; only the 8 categories the Product Finder
// maps to a body area (see PRODUCT_FINDER_BODY_AREAS in site.ts) have an
// entry — the other 3 (Traction & Immobilization Equipment, Vascular,
// Consumables & Equipment) aren't body-measurement products and keep the
// original "pending" copy below.
const HOW_TO_MEASURE: Record<string, string> = {
  "Cervical & Neck":
    "Measure around the base of your neck, where a collar would naturally sit, using a soft tape measure. Keep the tape snug but not tight.",
  "Back & Lumbar/Abdominal":
    "Measure around your waist at navel level, standing relaxed. For a lumbar support, measure at the point where the support will sit, usually just above the hips.",
  "Shoulder & Arm":
    "For a sling or shoulder support, measure around the widest part of your chest, under the arms. For an arm-specific support, measure around the upper arm at its widest point.",
  Elbow:
    "Measure around the elbow joint with your arm slightly bent, at the point where the support will sit.",
  "Wrist & Hand":
    "Measure around your wrist, just above the wrist bone, with a soft tape measure held snug but not tight.",
  Knee: "Measure around the knee at the center of the kneecap, with your leg straight.",
  "Ankle & Foot":
    "Measure around your ankle, just above the ankle bone, where the support will sit.",
  Chest:
    "Measure around your chest at its widest point, keeping the tape level across your back.",
};

export default async function SizeGuidePage() {
  const categoryEntries = await Promise.all(
    CRAFTSCARE_CATEGORIES.map(async (category) => {
      const slug = slugify(category);
      const howToMeasure = HOW_TO_MEASURE[category];

      if (!howToMeasure) {
        return { category, slug, howToMeasure: null, products: [] };
      }

      const categoryRecord = await getCategoryBySlug("craftscare", slug);
      const products = categoryRecord
        ? await getProductsWithSizeChart(categoryRecord.id)
        : [];

      return { category, slug, howToMeasure, products };
    }),
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-page-title">Size Guide</h1>
      <p className="text-body-muted mt-3">
        General measuring guidance by category. Full manufacturer size charts are
        linked below a category once confirmed for a specific product — none are
        invented here.
      </p>

      <div className="mt-8 divide-y divide-border border-y border-border">
        {categoryEntries.map(({ category, slug, howToMeasure, products }) => (
          <div key={category} id={slug} className="py-6 scroll-mt-24">
            <div className="flex items-center justify-between gap-4">
              <p className="text-body font-medium">{category}</p>
              <Link
                href={`/craftscare/${slug}`}
                className="rounded-sm shrink-0 text-sm text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                View products →
              </Link>
            </div>

            {howToMeasure ? (
              <>
                <p className="text-body-muted mt-2">
                  <span className="font-medium text-foreground">How to measure: </span>
                  {howToMeasure}
                </p>
                {products.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {products.map((product) => (
                      <li key={product.slug}>
                        <Link
                          href={`/craftscare/${slug}/${product.slug}`}
                          className="rounded-sm text-sm text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          See real size chart: {product.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-body-muted mt-2">
                Measurement chart pending — will be added once confirmed with the
                manufacturer.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
