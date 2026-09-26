import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { PRIMARY_NAV, UTILITY_NAV, BRANDS, CRAFTSCARE_CATEGORIES } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { listPublishedProductsForSitemap } from "@/lib/catalog";

// Reflects the Phase 2 route structure plus the brand-namespaced
// category routes added in Phase 3 (§3, §9.5), plus (Phase 12 §5) real
// published product URLs queried live from the database — Phase 9-11
// put real products in the DB, but this file was never revisited to
// pull them in, so the sitemap was still only listing category shells.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, priority: 1 },
    ...[...PRIMARY_NAV, ...UTILITY_NAV].map((link) => ({
      url: `${SITE_URL}${link.href}`,
      lastModified: now,
    })),
  ];

  const brandRoutes: MetadataRoute.Sitemap = BRANDS.map((brand) => ({
    url: `${SITE_URL}/brands/${brand.slug}`,
    lastModified: now,
  }));

  // Brand-namespaced category pages, e.g. /craftscare/knee
  const craftscareCategoryRoutes: MetadataRoute.Sitemap = CRAFTSCARE_CATEGORIES.map(
    (category) => ({
      url: `${SITE_URL}/craftscare/${slugify(category)}`,
      lastModified: now,
    }),
  );

  // Cross-brand category aggregate pages, e.g. /categories/knee
  const categoryAggregateRoutes: MetadataRoute.Sitemap = CRAFTSCARE_CATEGORIES.map(
    (category) => ({
      url: `${SITE_URL}/categories/${slugify(category)}`,
      lastModified: now,
    }),
  );

  // Real product pages, e.g. /craftscare/knee/functional-knee-support —
  // every publication_status = 'published' product, straight from the
  // DB, with the product's own updated_at as lastModified rather than
  // `now` (unlike the routes above, which have no per-row timestamp to
  // reflect). The URL is always under the literal "/craftscare" path
  // segment (see src/app/(site)/craftscare/[category]/[product]), not
  // `/${brandSlug}/...` — there's no [brand] route segment — so this
  // only queries Craftscare's products, same as getFeaturedProducts and
  // getProductBySlug do elsewhere.
  const products = await listPublishedProductsForSitemap("craftscare");
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/craftscare/${product.categorySlug}/${product.slug}`,
    lastModified: new Date(product.updatedAt),
  }));

  return [
    ...staticRoutes,
    ...brandRoutes,
    ...craftscareCategoryRoutes,
    ...categoryAggregateRoutes,
    ...productRoutes,
  ];
}
