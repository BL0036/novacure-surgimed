// Phase 3 — SEO metadata helpers.
// One reusable pattern so every page/route gets a consistent title,
// description, canonical URL, and Open Graph/Twitter tags, instead of
// each page inventing its own metadata shape. Real per-product copy is
// populated by Phase 9 — this file only builds the template.
//
// Phase 12 — added a site-wide default og:image (every page now gets
// one, not just pages that happen to pass `image`) and made the
// SITE_URL fallback an unmistakable placeholder rather than a guessed
// real-looking domain — see README "Phase 12 decisions".

import type { Metadata } from "next";
import { SITE_FULL_NAME } from "./site";

// TODO(production): set NEXT_PUBLIC_SITE_URL to the real production
// domain before deploying, and update this fallback's comment once
// that's decided. Nothing in this project's history confirms
// "novacure.com.np" (the previous fallback here) was ever an actual
// confirmed domain — it looks like a Phase 3 placeholder that read as
// real, which is exactly the trap Phase 12 was asked to avoid. Falling
// back to an obviously-fake .example.com domain means canonical/OG URLs
// are still well-formed in dev, but nobody mistakes it for the real
// site if it ever leaked into a build.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://novacuresurgimed.example.com";

// Site-wide fallback og:image/twitter:image — the real NovaCure logo
// (public/brand/novacure-logo.png, 1254×1254), not a fabricated image.
// Used whenever a page (most pages, and any product without a real
// photo yet) doesn't pass its own `image`. Per Phase 12 §2: a product
// with a real uploaded photo should use that photo's own URL instead —
// callers pass `image` (see the product page's generateMetadata) rather
// than this being product-specific.
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/novacure-logo.png`;
const DEFAULT_OG_IMAGE_SIZE = { width: 1254, height: 1254 };

interface BuildMetadataOptions {
  /** Page title. Combined with SITE_FULL_NAME via the title template below. */
  title: string;
  description: string;
  /** Path only, e.g. "/craftscare/knee" — SITE_URL is prepended. */
  path: string;
  /** Absolute URL of a page-specific image (e.g. a product's real
   *  photo). Omit to fall back to DEFAULT_OG_IMAGE. */
  image?: string;
  /** Alt text for `image`. Ignored when `image` is omitted (the default
   *  logo has its own fixed alt text). Falls back to `title`. */
  imageAlt?: string;
  /** Set true for placeholder/thin pages that shouldn't be indexed yet. */
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  noIndex,
}: BuildMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`;

  const ogImage = image
    ? { url: image, alt: imageAlt ?? title }
    : { url: DEFAULT_OG_IMAGE, alt: `${SITE_FULL_NAME} logo`, ...DEFAULT_OG_IMAGE_SIZE };

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
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
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
