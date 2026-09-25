import Link from "next/link";
import { CRAFTSCARE_CATEGORIES, SITE_FULL_NAME, CONTACT_WHATSAPP_URL, CRAFTSCARE_CERTIFICATIONS } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { getFeaturedProducts } from "@/lib/catalog";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";

// Phase 8 §2 — the real homepage, replacing the Phase 2 placeholder.
// Sections follow Master Plan §16 in order. Every section either queries
// live data (categories, featured products) or is clearly marked as
// placeholder copy pending the project owner (Phase 8 §5) — nothing here
// is invented marketing content.

export default async function Home() {
  const featured = await getFeaturedProducts("craftscare", 8);

  return (
    <div>
      {/* 1. Hero */}
      <section className="border-b border-border bg-brand-tint">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <p className="text-eyebrow">{SITE_FULL_NAME}</p>
          <h1 className="text-page-title mt-2 max-w-2xl">Quality you can rely on</h1>
          <p className="text-body-muted mt-3 max-w-xl">
            Empowering hospitals with reliable surgical, orthopedic, and lab supplies.
            Trusted by professionals across Nepal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/craftscare/knee" variant="primary">
              Shop Craftscare
            </Button>
            <Button href="/product-finder" variant="secondary">
              Find the right product
            </Button>
          </div>
        </div>
      </section>

      {/* About NovaCure — added in the Phase 8 content pass (paragraph
          supplied by owner). Master Plan §16 doesn't define a dedicated
          homepage About section, so this sits right after Hero as the
          natural next block before the category grid. Founder credit
          line lives on /about only, per the request. */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <p className="text-eyebrow">About us</p>
          <h2 className="text-section-heading mt-1">{SITE_FULL_NAME}</h2>
          <p className="text-body-muted mt-2 max-w-2xl">
            At NovaCure SurgiMed, we are dedicated to providing reliable and
            high-quality surgical, orthopedic, and lab reagent products to
            healthcare institutions across Nepal. Based in Mahalaxmi, Lalitpur, our
            company combines experience and innovation to meet the evolving needs
            of hospitals and medical professionals. With a focus on customer
            satisfaction and product integrity, we aim to support better
            healthcare delivery through trusted medical supplies.
          </p>
          <Link href="/about" className="mt-4 inline-block text-sm text-brand hover:underline">
            More about us →
          </Link>
        </div>
      </section>

      {/* 2. Shop by body area / category */}
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <h2 className="text-section-heading">Shop by body area</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CRAFTSCARE_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/craftscare/${slugify(category)}`}
              className="rounded-lg border border-border px-4 py-5 text-sm font-medium text-foreground transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* 3 & 6. Featured/Popular products — merged into one section, see
          README "Phase 8 decisions": no "featured" flag and no order data
          to distinguish the two yet, so both show the same honest
          "most recently updated published products" default. */}
      <section className="border-t border-border bg-brand-tint/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-section-heading">Featured products</h2>
            <Link
              href="/brands/craftscare"
              className="text-sm text-brand hover:underline"
            >
              View all Craftscare products →
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-body-muted mt-6">
              No products published yet — check back soon.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  href={`/craftscare/${product.categorySlug}/${product.slug}`}
                  name={product.name}
                  shortDescription={product.shortDescription}
                  minPrice={product.minPrice}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Product Finder call-to-action */}
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="rounded-lg border border-border px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-section-heading">Not sure what you need?</h2>
          <p className="text-body-muted mt-2 max-w-xl">
            Answer a couple of quick questions about the body area and we&rsquo;ll point
            you to the right category.
          </p>
          <Button href="/product-finder" variant="primary" className="mt-5">
            Try the Product Finder
          </Button>
        </div>
      </section>

      {/* 5. Craftscare brand introduction */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <p className="text-eyebrow">Our brand</p>
          <h2 className="text-section-heading mt-1">Craftscare</h2>
          <p className="text-body-muted mt-2 max-w-2xl">
            Craft&rsquo;s Care is an established Indian orthopaedic and
            rehabilitation brand, manufactured by Ortho Rehabilitation Aid. The
            range covers cervical, back and lumbar, abdominal, wrist and elbow,
            and ankle orthoses, along with traction appliances, neoprene
            supports, and walking aids. Craft&rsquo;s Care products are
            manufactured under ISO 9001:2008, ISO 9001:2015, WHO-GMP, CE, MSME,
            and FDA compliance standards, and are distributed in Nepal by
            NovaCure SurgiMed.
          </p>
          <Link href="/brands/craftscare" className="mt-4 inline-block text-sm text-brand hover:underline">
            More about Craftscare →
          </Link>
        </div>
      </section>

      {/* 7. Helpful guides */}
      <section className="border-t border-border bg-brand-tint/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <h2 className="text-section-heading">Helpful guides</h2>
          <p className="text-body-muted mt-2 max-w-xl">
            Buying guides and educational content are coming soon.
          </p>
          <Link href="/guides" className="mt-4 inline-block text-sm text-brand hover:underline">
            Visit Guides →
          </Link>
        </div>
      </section>

      {/* 8. Business / hospital / pharmacy section */}
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="rounded-lg border border-border px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-section-heading">Hospitals &amp; pharmacies</h2>
          <p className="text-body-muted mt-2 max-w-xl">
            Institutional and wholesale enquiries for government hospitals, offices,
            and pharmacies.
          </p>
          <Button href="/for-hospitals-pharmacies" variant="secondary" className="mt-5">
            Learn more
          </Button>
        </div>
      </section>

      {/* 9. Trust / information section. Certifications belong to the
          Craftscare manufacturer, not to NovaCure SurgiMed as the platform
          operator — copy is worded accordingly (Phase 8 content pass §6),
          not as a claim NovaCure itself holds them. Previously held back
          per Phase 5 §4 / Master Plan §26 pending confirmation; now
          confirmed by the project owner. */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <h2 className="text-section-heading">Quality-focused sourcing</h2>
          <p className="text-body-muted mt-2 max-w-xl">
            Craftscare products are manufactured under the following certifications:
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CRAFTSCARE_CERTIFICATIONS.map((cert) => (
              <li
                key={cert}
                className="rounded-full border border-border px-3 py-1 text-sm font-medium text-foreground"
              >
                {cert}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10. Contact / WhatsApp */}
      <section className="border-t border-border bg-brand-tint/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <h2 className="text-section-heading">Get in touch</h2>
          <p className="text-body-muted mt-2 max-w-xl">
            Have a question or need a quote? Reach us on WhatsApp or visit our contact
            page for phone, email, and address details.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" variant="primary">
              Message us on WhatsApp
            </Button>
            <Button href="/contact" variant="secondary">
              Contact us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
