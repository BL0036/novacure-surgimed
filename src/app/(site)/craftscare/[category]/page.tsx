import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CRAFTSCARE_CATEGORY_SLUGS, getCraftscareCategoryBySlug } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import {
  getCategoryBySlug,
  getCategorySizeLabels,
  listCategoryProducts,
  type CategorySort,
} from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { Pagination } from "@/components/Pagination";

// Phase 3 §3/§9.5 — brand-namespaced category route, e.g.
// /craftscare/knee. Phase 4 §2 — queries published Products/Variants
// generically (works against an empty DB or Phase-1 test data; no
// product names hardcoded here).

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; size?: string; page?: string }>;
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
    title: `${category} | Craftscare`,
    description: `${category} products from Craftscare, carried by NovaCure SurgiMed Suppliers in Nepal.`,
    path: `/craftscare/${slug}`,
  });
}

const VALID_SORTS: CategorySort[] = ["name", "price-asc", "price-desc"];

export default async function CraftscareCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { category: slug } = await params;
  const { sort: sortParam, size: sizeParam, page: pageParam } = await searchParams;
  const category = getCraftscareCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const sort: CategorySort = VALID_SORTS.includes(sortParam as CategorySort)
    ? (sortParam as CategorySort)
    : "name";
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;

  const categoryRecord = await getCategoryBySlug("craftscare", slug);

  const [availableSizes, listing] = categoryRecord
    ? await Promise.all([
        getCategorySizeLabels(categoryRecord.id),
        listCategoryProducts(categoryRecord.id, {
          sort,
          sizeLabel: sizeParam,
          page,
        }),
      ])
    : [
        [] as string[],
        {
          products: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      ];

  const basePath = `/craftscare/${slug}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Craftscare", path: "/brands/craftscare" },
          { name: category, path: basePath },
        ])}
      />
      <p className="text-sm font-medium text-brand">
        <Link href="/brands/craftscare" className="hover:underline">
          Craftscare
        </Link>
      </p>
      <h1 className="text-page-title mt-2">{category}</h1>

      <CategoryFilterBar
        basePath={basePath}
        sort={sort}
        sizeLabel={sizeParam}
        availableSizes={availableSizes}
      />

      <p className="mt-4 text-sm">
        <Link
          href={`/size-guide#${slug}`}
          className="rounded-sm text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Not sure of your size? See how to measure
        </Link>
      </p>

      {listing.products.length === 0 ? (
        <p className="text-body-muted mt-8">
          No products published in this category yet.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listing.products.map((product) => (
            <ProductCard
              key={product.id}
              href={`${basePath}/${product.slug}`}
              name={product.name}
              shortDescription={product.shortDescription}
              minPrice={product.minPrice}
            />
          ))}
        </div>
      )}

      <Pagination
        basePath={basePath}
        page={listing.page}
        totalPages={listing.totalPages}
        otherParams={{
          sort: sort === "name" ? undefined : sort,
          size: sizeParam,
        }}
      />
    </div>
  );
}
