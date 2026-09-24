import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCraftscareCategoryBySlug } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";

// Phase 3 §3/§9.5 — brand-namespaced product route, e.g.
// /craftscare/knee/functional-knee-support. Placeholder only: no real
// product data is queried or invented here (that's Phase 8/9, once
// products are published from the Product/ProductVariant tables). The
// Product JSON-LD helper (src/lib/structured-data.ts) is intentionally
// NOT called on this page yet — see Phase 3 plan §8.
//
// Title-template reference for Phase 9 (Phase 3 plan §7):
//   buildProductTitle(product.name, category.name, "Craftscare")
//   => "{Product Name} | {Category} | Craftscare — NovaCure Nepal"

interface PageProps {
  params: Promise<{ category: string; product: string }>;
}

// No product data exists yet to enumerate params from — left empty so
// the route works as an on-demand placeholder until Phase 8/9 wire it
// to real products (at which point this becomes a DB-driven list).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: categorySlug, product: productSlug } = await params;
  const category = getCraftscareCategoryBySlug(categorySlug);
  if (!category) return {};

  return buildMetadata({
    title: `${productSlug} | ${category} | Craftscare`,
    description:
      "Product detail page — content is populated once the catalogue is published (Phase 8/9).",
    path: `/craftscare/${categorySlug}/${productSlug}`,
    noIndex: true, // placeholder — remove once real product content exists
  });
}

export default async function CraftscareProductPage({ params }: PageProps) {
  const { category: categorySlug, product: productSlug } = await params;
  const category = getCraftscareCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Craftscare", path: "/brands/craftscare" },
          { name: category, path: `/craftscare/${categorySlug}` },
          {
            name: productSlug,
            path: `/craftscare/${categorySlug}/${productSlug}`,
          },
        ])}
      />
      <p className="text-sm font-medium text-brand">
        <Link href={`/craftscare/${categorySlug}`} className="hover:underline">
          {category}
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Product page — content coming soon
      </h1>
      <p className="mt-3 text-sm text-muted">
        Real product name, description, images, sizes, and pricing are
        populated here once the catalogue is published (Phase 8/9). No
        product copy is invented on this placeholder route.
      </p>
    </div>
  );
}
