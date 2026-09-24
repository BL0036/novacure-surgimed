// Phase 3 — SEO metadata helpers.
// One reusable pattern so every page/route gets a consistent title,
// description, canonical URL, and Open Graph/Twitter tags, instead of
// each page inventing its own metadata shape. Real per-product copy is
// populated by Phase 9 — this file only builds the template.

import type { Metadata } from "next";
import { SITE_FULL_NAME } from "./site";

// Set NEXT_PUBLIC_SITE_URL once the production domain is known; falls
// back to a placeholder so canonical/OG URLs are still well-formed in
// dev. Update .env.example alongside DATABASE_URL when the real domain
// is decided.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.novacure.com.np";

interface BuildMetadataOptions {
  /** Page title. Combined with SITE_FULL_NAME via the title template below. */
  title: string;
  description: string;
  /** Path only, e.g. "/craftscare/knee" — SITE_URL is prepended. */
  path: string;
  image?: string;
  /** Set true for placeholder/thin pages that shouldn't be indexed yet. */
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: BuildMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_FULL_NAME,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

// Product page title template (Phase 3 §7):
// "{Product Name} | {Category} | Craftscare — NovaCure Nepal"
// Wire this up with real data in Phase 9 — do not fill with placeholder
// product copy in the meantime.
export function buildProductTitle(
  productName: string,
  categoryName: string,
  brandName: string,
): string {
  return `${productName} | ${categoryName} | ${brandName} — NovaCure Nepal`;
}
