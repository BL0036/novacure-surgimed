import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCraftscareCategoryBySlug } from "@/lib/site";
import { buildMetadata, buildProductTitle, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/structured-data";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductGallery } from "@/components/ProductGallery";
import { VariantSelector } from "@/components/VariantSelector";
import { ProductCard } from "@/components/ProductCard";

// Phase 3 §3/§9.5 — brand-namespaced product route, e.g.
// /craftscare/knee/functional-knee-support. Phase 8 §4/§5 replaces the
// Phase 2/3 placeholder with the real page: image gallery, variant/size
// selector, breadcrumbs, related products, and Product JSON-LD (gated on
// ProductStatus = "published", not just PublicationStatus — see
// src/lib/catalog.ts's ProductDetail.status comment).

interface PageProps {
  params: Promise<{ category: string; product: string }>;
}

// No product data is enumerated at build time yet — this stays an
// on-demand route (Phase 3 decision, unchanged in Phase 8) rather than
// switching to generateStaticParams backed by a build-time DB query.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug, product: productSlug } = await params;
  const category = getCraftscareCategoryBySlug(categorySlug);
  if (!category) return {};

  const product = await getProductBySlug("craftscare", categorySlug, productSlug);
  if (!product) return {};

  return buildMetadata({
    title: buildProductTitle(product.name, product.categoryName, product.brandName),
    description:
      product.shortDescription ??
      `${product.name} from ${product.brandName}, carried by NovaCure SurgiMed Suppliers in Nepal.`,
    path: `/craftscare/${categorySlug}/${productSlug}`,
  });
}

export default async function CraftscareProductPage({ params }: PageProps) {
  const { category: categorySlug, product: productSlug } = await params;
  const category = getCraftscareCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const product = await getProductBySlug("craftscare", categorySlug, productSlug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.categoryId, product.id);
  const productPath = `/craftscare/${categorySlug}/${productSlug}`;
  const lowestPrice = product.variants.find((v) => v.retailPrice !== null)?.retailPrice ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Craftscare", path: "/brands/craftscare" },
          { name: category, path: `/craftscare/${categorySlug}` },
          { name: product.name, path: productPath },
        ])}
      />
      {/* Only "published" ProductStatus gets structured data — a product
          can be publication_status "published" (visible on the site) while
          its own status is still "verified" or earlier, since admins set
          the two fields independently (see README "Phase 7 decisions"). */}
      {product.status === "published" ? (
        <JsonLd
          data={productJsonLd({
            name: product.name,
            description: product.shortDescription,
            brandName: product.brandName,
            sku: product.variants[0]?.sku,
            price: lowestPrice ?? undefined,
            priceCurrency: "NPR",
            availability: product.variants.some((v) => v.stockStatus === "in_stock")
              ? "InStock"
              : product.variants.every((v) => v.stockStatus === "discontinued")
                ? "Discontinued"
                : "OutOfStock",
            url: `${SITE_URL}${productPath}`,
          })}
        />
      ) : null}

      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-muted">
          <li>
            <Link href="/brands/craftscare" className="hover:text-foreground hover:underline">
              Craftscare
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/craftscare/${categorySlug}`}
              className="hover:text-foreground hover:underline"
            >
              {category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <p className="text-eyebrow">{product.brandName}</p>
          <h1 className="text-page-title mt-1">{product.name}</h1>
          {product.shortDescription ? (
            <p className="text-body-muted mt-3">{product.shortDescription}</p>
          ) : null}

          <div className="mt-6 border-t border-border pt-6">
            <VariantSelector
              variants={product.variants}
              productManufacturerRefCode={product.manufacturerRefCode}
            />
          </div>

          {product.fullDescription ? (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-section-heading">Description</h2>
              <p className="text-body-muted mt-2 whitespace-pre-line">
                {product.fullDescription}
              </p>
            </div>
          ) : null}

          {product.features ? (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-section-heading">Features</h2>
              <p className="text-body-muted mt-2 whitespace-pre-line">
                {product.features}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="text-section-heading">Related products</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                href={`/craftscare/${categorySlug}/${item.slug}`}
                name={item.name}
                shortDescription={item.shortDescription}
                minPrice={item.minPrice}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
