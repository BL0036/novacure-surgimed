import type { Metadata } from "next";
import { searchProducts } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { SearchForm } from "@/components/SearchForm";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return buildMetadata({
    title: q ? `Search: ${q}` : "Search",
    description: "Search NovaCure Surgimed Suppliers' product catalogue.",
    path: "/search",
    noIndex: true, // search results pages aren't indexed
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams;
  const query = q?.trim() ?? "";
  const pageNumber = Number(page) > 0 ? Number(page) : 1;

  const result = query
    ? await searchProducts(query, pageNumber)
    : { results: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="text-page-title">Search</h1>
      <SearchForm defaultValue={query} className="mt-4 max-w-sm" />

      {!query ? (
        <p className="text-body-muted mt-6">
          Enter a product name, catalogue reference, or category to search.
        </p>
      ) : (
        <>
          <p className="text-body-muted mt-6">
            {result.total === 0
              ? `No results for "${query}".`
              : `${result.total} result${result.total === 1 ? "" : "s"} for "${query}"`}
          </p>

          {result.results.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.results.map((product) => (
                <ProductCard
                  key={product.id}
                  href={`/${product.brandSlug}/${product.categorySlug}/${product.slug}`}
                  name={product.name}
                  shortDescription={product.shortDescription}
                  minPrice={product.minPrice}
                  eyebrow={product.categoryName}
                />
              ))}
            </div>
          ) : null}

          <Pagination
            basePath="/search"
            page={result.page}
            totalPages={result.totalPages}
            otherParams={{ q: query }}
          />
        </>
      )}
    </div>
  );
}
