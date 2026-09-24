// Site-wide constants for Phase 2 (brand + platform architecture).
// Nav structure follows Master Plan §11; category list mirrors the 11
// Craftscare categories already seeded via the Phase 1 CSV importer
// (see prisma/schema.prisma — Category is scoped to brandId).

export const SITE_NAME = "NovaCure";
export const SITE_FULL_NAME = "NovaCure Surgimed Suppliers";

export interface NavLink {
  label: string;
  href: string;
}

// Primary header nav. "Shop" and "Brands" are kept as separate items even
// though they overlap while Craftscare is the only brand — see Phase 2
// notes: once brand #2 exists, "Shop" becomes an all-brand view and
// "Brands" becomes a brand picker, with no restructuring needed.
export const PRIMARY_NAV: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Brands", href: "/brands" },
  { label: "Categories", href: "/categories" },
  { label: "Guides", href: "/guides" },
  { label: "For Hospitals & Pharmacies", href: "/for-hospitals-pharmacies" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// Secondary / footer utility links (not yet functional — Phase 10).
export const UTILITY_NAV: NavLink[] = [
  { label: "Product Finder", href: "/product-finder" },
  { label: "Size Guide", href: "/size-guide" },
];

export const FOOTER_NAV: NavLink[] = [...PRIMARY_NAV, ...UTILITY_NAV];

// The 11 Craftscare categories from the Phase 1 catalogue import.
// Flat list, brand-scoped — matches the Category model, no invented copy.
export const CRAFTSCARE_CATEGORIES = [
  "Cervical & Neck",
  "Back & Lumbar/Abdominal",
  "Shoulder & Arm",
  "Elbow",
  "Wrist & Hand",
  "Knee",
  "Ankle & Foot",
  "Traction & Immobilization Equipment",
  "Vascular",
  "Chest",
  "Consumables & Equipment",
] as const;

import { slugify } from "./slugify";

// Slug lookup for the Craftscare categories above, used by the
// brand-namespaced (/craftscare/[category]) and cross-brand
// (/categories/[category]) route params added in Phase 3 §3/§9.5.
export const CRAFTSCARE_CATEGORY_SLUGS: Record<string, string> = Object.fromEntries(
  CRAFTSCARE_CATEGORIES.map((category) => [slugify(category), category]),
);

export function getCraftscareCategoryBySlug(slug: string): string | undefined {
  return CRAFTSCARE_CATEGORY_SLUGS[slug];
}

// Product Finder Step 1 — body area → matching Craftscare category
// (Phase 4 plan §4). Deliberately does not include Traction &
// Immobilization Equipment, Vascular, or Consumables & Equipment: they
// don't map to a single body area the way the others do, and are
// reached via "browse all categories" instead.
export interface BodyAreaOption {
  label: string;
  categorySlug: string;
}

export const PRODUCT_FINDER_BODY_AREAS: BodyAreaOption[] = [
  { label: "Neck", categorySlug: slugify("Cervical & Neck") },
  { label: "Back / Abdomen", categorySlug: slugify("Back & Lumbar/Abdominal") },
  { label: "Shoulder / Arm", categorySlug: slugify("Shoulder & Arm") },
  { label: "Elbow", categorySlug: slugify("Elbow") },
  { label: "Wrist / Hand / Finger", categorySlug: slugify("Wrist & Hand") },
  { label: "Knee", categorySlug: slugify("Knee") },
  { label: "Ankle / Foot", categorySlug: slugify("Ankle & Foot") },
  { label: "Chest", categorySlug: slugify("Chest") },
];

export const PRODUCT_FINDER_DISCLAIMER =
  "This tool helps you find the right product category — it does not diagnose a medical condition. Consult a healthcare professional for medical advice.";

export interface BrandSummary {
  name: string;
  slug: string;
}

// Only Craftscare exists as of Phase 2. Adding a second brand later needs
// a new Brand row + this array updated — no schema or route changes.
export const BRANDS: BrandSummary[] = [{ name: "Craftscare", slug: "craftscare" }];
