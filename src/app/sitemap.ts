import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { PRIMARY_NAV, UTILITY_NAV, BRANDS, CRAFTSCARE_CATEGORIES } from "@/lib/site";
import { slugify } from "@/lib/slugify";

// Reflects the Phase 2 route structure plus the brand-namespaced
// category routes added in Phase 3 (§3, §9.5). This will automatically
// extend once real product pages exist under Phase 8/9 — no rewrite
// needed here, just add product routes to the arrays below (or, once
// products are in the DB, generate this from a query instead of the
// static category list).
export default function sitemap(): MetadataRoute.Sitemap {
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

  return [
    ...staticRoutes,
    ...brandRoutes,
    ...craftscareCategoryRoutes,
    ...categoryAggregateRoutes,
  ];
}
