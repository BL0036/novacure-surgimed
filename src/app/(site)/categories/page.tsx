import Link from "next/link";
import type { Metadata } from "next";
import { CRAFTSCARE_CATEGORIES } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Categories",
  description:
    "Browse product categories across all brands carried by NovaCure SurgiMed Suppliers.",
  path: "/categories",
});

// Flattened shortcut from the header nav (Master Plan §11). Currently
// mirrors Craftscare's categories 1:1 since it's the only brand; once a
// second brand exists this becomes a real cross-brand aggregate.
export default function CategoriesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-page-title">Categories</h1>
      <p className="text-body-muted mt-3">
        All categories across carried brands. Currently these are Craftscare&rsquo;s
        categories only.
      </p>

      <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {CRAFTSCARE_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              href={`/categories/${slugify(category)}`}
              className="rounded-sm text-foreground transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
