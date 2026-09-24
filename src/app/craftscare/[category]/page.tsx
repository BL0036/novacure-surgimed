import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CRAFTSCARE_CATEGORY_SLUGS,
  getCraftscareCategoryBySlug,
} from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";

// Phase 3 §3/§9.5 — brand-namespaced category route, e.g.
// /craftscare/knee. Placeholder content only: real listings are built
// once product pages exist (Phase 8/9). This route/param structure is
// what Phase 8/9 fill in, not what invents category copy now.

interface PageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return Object.keys(CRAFTSCARE_CATEGORY_SLUGS).map((slug) => ({
    category: slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCraftscareCategoryBySlug(slug);
  if (!category) return {};

  return buildMetadata({
    title: `${category} | Craftscare`,
    description: `${category} products from Craftscare, carried by NovaCure Surgimed Suppliers in Nepal.`,
    path: `/craftscare/${slug}`,
    noIndex: true, // placeholder — remove once real listings exist (Phase 8/9)
  });
}

export default async function CraftscareCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getCraftscareCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Craftscare", path: "/brands/craftscare" },
          { name: category, path: `/craftscare/${slug}` },
        ])}
      />
      <p className="text-sm font-medium text-brand">
        <Link href="/brands/craftscare" className="hover:underline">
          Craftscare
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {category}
      </h1>
      <p className="mt-3 text-sm text-muted">
        Products in this category are listed here once the catalogue is
        published (Phase 8/9). This page is a placeholder route only.
      </p>
    </div>
  );
}
