import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CRAFTSCARE_CATEGORY_SLUGS, getCraftscareCategoryBySlug } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

// Cross-brand category aggregate, e.g. /categories/knee — currently
// mirrors the matching /craftscare/[category] page 1:1 since Craftscare
// is the only brand (same placeholder pattern as the flat /categories
// list this replaces links to). Becomes a real cross-brand aggregate
// once a second brand exists — see src/lib/site.ts BRANDS comment.

interface PageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return Object.keys(CRAFTSCARE_CATEGORY_SLUGS).map((slug) => ({
    category: slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCraftscareCategoryBySlug(slug);
  if (!category) return {};

  return buildMetadata({
    title: `${category} — Categories`,
    description: `${category} products across all brands carried by NovaCure Surgimed Suppliers.`,
    path: `/categories/${slug}`,
    noIndex: true, // placeholder — remove once real listings exist (Phase 8/9)
  });
}

export default async function CategoryAggregatePage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getCraftscareCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <p className="text-sm font-medium text-brand">
        <Link href="/categories" className="hover:underline">
          Categories
        </Link>
      </p>
      <h1 className="text-page-title mt-2">{category}</h1>
      <p className="text-body-muted mt-3">
        Currently sourced from Craftscare only.{" "}
        <Link href={`/craftscare/${slug}`} className="text-brand hover:underline">
          View in Craftscare
        </Link>
        . Real cross-brand listings are built once a second brand and real product pages
        exist (Phase 8/9).
      </p>
    </div>
  );
}
