// Phase 3 — schema.org structured data (JSON-LD) helpers.
// Reusable builder functions, not hardcoded per page. Pair with the
// <JsonLd> component (src/components/JsonLd.tsx) to render them.
//
// Product schema is READY but must not be wired to placeholder Phase 2/3
// content — see Phase 3 plan §8. It gets used once Phase 9 has real
// product data (name, price, availability from ProductVariant).

import { SITE_FULL_NAME } from "./site";
import { SITE_URL } from "./seo";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_FULL_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/novacure-logo.png`,
  };
}

export type ProductAvailability =
  | "InStock"
  | "OutOfStock"
  | "Discontinued"
  | "PreOrder";

interface ProductJsonLdInput {
  name: string;
  description?: string | null;
  brandName: string;
  sku?: string;
  price?: string | number;
  priceCurrency?: string;
  availability?: ProductAvailability;
  url: string;
  image?: string;
}

// Do not call this against placeholder/fake price or availability data —
// once indexed by search engines, incorrect structured data is
// misleading. Hold off until Phase 9 has real ProductVariant data.
export function productJsonLd(input: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    brand: { "@type": "Brand", name: input.brandName },
    sku: input.sku,
    image: input.image,
    url: input.url,
    offers: input.price
      ? {
          "@type": "Offer",
          price: input.price,
          priceCurrency: input.priceCurrency ?? "NPR",
          availability: input.availability
            ? `https://schema.org/${input.availability}`
            : undefined,
          url: input.url,
        }
      : undefined,
  };
}

interface BreadcrumbItem {
  name: string;
  /** Path only, e.g. "/craftscare/knee" — SITE_URL is prepended. */
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

interface FaqItem {
  question: string;
  answer: string;
}

// For Guide pages genuinely structured as Q&A (Phase 3 plan §4) — do not
// apply to pages that aren't actually FAQ-formatted.
export function faqPageJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
