import Link from "next/link";
import {
  CRAFTSCARE_CATEGORIES,
  SITE_FULL_NAME,
  CONTACT_WHATSAPP_URL,
  CRAFTSCARE_CERTIFICATIONS,
  HERO_IMAGE,
} from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { getFeaturedProducts } from "@/lib/catalog";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Hero } from "@/components/Hero";

// Phase 8 §2 — the real homepage, replacing the Phase 2 placeholder.
// Sections follow Master Plan §16 in order. Every section either queries
// live data (categories, featured products) or is clearly marked as
// placeholder copy pending the project owner (Phase 8 §5) — nothing here
// is invented marketing content.
//
// Visual upgrade — layout/styling only; section order and all copy are
// unchanged. Sections alternate white / --surface backgrounds, share the
// .page-container width and .section-y spacing, and blocks that were bare
// bordered boxes are now cards (.card-surface).

// Phase 12 §3 — same 300s revalidation window as the product/category
// pages, not the 3600s "static pages" bucket: the Featured products
// section below queries live product data, same as those pages, even
// though this route isn't literally named in either list in the request.
export const revalidate = 300;

const LINK_CLASSES =
  "mt-5 inline-block rounded-sm text-sm font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default async function Home() {
  const featured = await getFeaturedProducts("craftscare", 8);

  return (
    <div>
      {/* 1. Hero */}
      <Hero image={HERO_IMAGE} />

      {/* About NovaCure — added in the Phase 8 content pass (paragraph
          supplied by owner). Founder credit line lives on /about only. */}
      <section className="section-y">
        <div className="page-container grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <div>
            <p className="text-eyebrow">About us</p>
            <h2 className="text-display-heading mt-2">{SITE_FULL_NAME}</h2>
          </div>
          <div>
            <p className="text-lead">
              At NovaCure SurgiMed, we are dedicated to providing reliable and
              high-quality surgical, orthopedic, and lab reagent products to
              healthcare institutions across Nepal. Based in Mahalaxmi, Lalitpur, our
              company combines experience and innovation to meet the evolving needs
              of hospitals and medical professionals. With a focus on customer
              satisfaction and product integrity, we aim to support better
              healthcare delivery through trusted medical supplies.
            </p>
            <Link href="/about" className={LINK_CLASSES}>
              More about us →
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Shop by body area / category */}
      <section className="section-y bg-surface">
        <div className="page-container">
          <h2 className="text-display-heading">Shop by body area</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {CRAFTSCARE_CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/craftscare/${slugify(category)}`}
                className="card-surface card-interactive group flex items-center gap-3 px-3 py-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-icon transition-colors group-hover:bg-brand group-hover:text-white">
                  <CategoryIcon category={category} className="h-7 w-7" />
                </span>
                {/* Zero-width space after "/" lets "Lumbar/Abdominal" wrap on narrow
                    tiles; the visible label is unchanged. */}
                <span className="min-w-0">{category.split("/").join("/\u200b")}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3 & 6. Featured/Popular products — merged into one section, see
          README "Phase 8 decisions": no "featured" flag and no order data
          to distinguish the two yet, so both show the same honest
          "most recently updated published products" default. */}
      <section className="section-y">
        <div className="page-container">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-display-heading">Featured products</h2>
            <Link
              href="/brands/craftscare"
              className="rounded-sm text-sm font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              View all Craftscare products →
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-body-muted mt-6">
              No products published yet — check back soon.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  href={`/craftscare/${product.categorySlug}/${product.slug}`}
                  name={product.name}
                  shortDescription={product.shortDescription}
                  minPrice={product.minPrice}
                  image={product.image}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Product Finder call-to-action */}
      <section className="section-y bg-surface">
        <div className="page-container">
          <div className="card-surface flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
            <div>
              <h2 className="text-display-heading">Not sure what you need?</h2>
              <p className="text-lead mt-2 max-w-xl">
                Answer a couple of quick questions about the body area and we&rsquo;ll point
                you to the right category.
              </p>
            </div>
            <Button href="/product-finder" variant="primary" className="shrink-0 px-5 py-2.5">
              Try the Product Finder
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Craftscare brand introduction */}
      <section className="section-y">
        <div className="page-container grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <div>
            <p className="text-eyebrow">Our brand</p>
            <h2 className="text-display-heading mt-2">Craftscare</h2>
          </div>
          <div>
            <p className="text-lead">
              Craft&rsquo;s Care is an established Indian orthopaedic and
              rehabilitation brand, manufactured by Ortho Rehabilitation Aid. The
              range covers cervical, back and lumbar, abdominal, wrist and elbow,
              and ankle orthoses, along with traction appliances, neoprene
              supports, and walking aids. Craft&rsquo;s Care products are
              manufactured under ISO 9001:2008, ISO 9001:2015, WHO-GMP, CE, MSME,
              and FDA compliance standards, and are distributed in Nepal by
              NovaCure SurgiMed.
            </p>
            <Link href="/brands/craftscare" className={LINK_CLASSES}>
              More about Craftscare →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Helpful guides */}
      <section className="section-y bg-surface">
        <div className="page-container">
          <h2 className="text-display-heading">Helpful guides</h2>
          <p className="text-lead mt-2 max-w-xl">
            Buying guides and educational content are coming soon.
          </p>
          <Link href="/guides" className={LINK_CLASSES}>
            Visit Guides →
          </Link>
        </div>
      </section>

      {/* 8. Business / hospital / pharmacy section */}
      <section className="section-y">
        <div className="page-container">
          <div className="card-surface flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
            <div>
              <h2 className="text-display-heading">Hospitals &amp; pharmacies</h2>
              <p className="text-lead mt-2 max-w-xl">
                Institutional and wholesale enquiries for government hospitals, offices,
                and pharmacies.
              </p>
            </div>
            <Button href="/for-hospitals-pharmacies" variant="secondary" className="shrink-0 px-5 py-2.5">
              Learn more
            </Button>
          </div>
        </div>
      </section>

      {/* 9. Trust / information section. Certifications belong to the
          Craftscare manufacturer, not to NovaCure SurgiMed as the platform
          operator — copy is worded accordingly (Phase 8 content pass §6),
          not as a claim NovaCure itself holds them. Previously held back
          per Phase 5 §4 / Master Plan §26 pending confirmation; now
          confirmed by the project owner. */}
      <section className="section-y bg-surface">
        <div className="page-container">
          <h2 className="text-display-heading">Quality-focused sourcing</h2>
          <p className="text-lead mt-2 max-w-xl">
            Craftscare products are manufactured under the following certifications:
          </p>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {CRAFTSCARE_CERTIFICATIONS.map((cert) => (
              <li
                key={cert}
                className="card-surface rounded-full px-4 py-1.5 text-sm font-medium text-foreground"
              >
                {cert}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10. Contact / WhatsApp */}
      <section className="section-y">
        <div className="page-container">
          <div className="card-surface flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
            <div>
              <h2 className="text-display-heading">Get in touch</h2>
              <p className="text-lead mt-2 max-w-xl">
                Have a question or need a quote? Reach us on WhatsApp or visit our contact
                page for phone, email, and address details.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" variant="primary" className="px-5 py-2.5">
                Message us on WhatsApp
              </Button>
              <Button href="/contact" variant="secondary" className="px-5 py-2.5">
                Contact us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
