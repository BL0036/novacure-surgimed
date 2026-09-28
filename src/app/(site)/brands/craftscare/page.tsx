import Link from "next/link";
import type { Metadata } from "next";
import { CRAFTSCARE_CATEGORIES } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Craftscare",
  description:
    "Craftscare orthopaedic products, carried by NovaCure SurgiMed Suppliers in Nepal.",
  path: "/brands/craftscare",
});

export default function CraftscareBrandPage() {
  return (
    <div className="page-container-narrow py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Brands", path: "/brands" },
          { name: "Craftscare", path: "/brands/craftscare" },
        ])}
      />
      <p className="text-sm font-medium text-link">Brand</p>
      <h1 className="text-page-title mt-2">Craftscare</h1>
      <p className="text-body-muted mt-3 max-w-2xl">
        Craft&rsquo;s Care is an established Indian orthopaedic and rehabilitation
        brand, manufactured by Ortho Rehabilitation Aid. The range covers cervical,
        back and lumbar, abdominal, wrist and elbow, and ankle orthoses, along with
        traction appliances, neoprene supports, and walking aids. Craft&rsquo;s Care
        products are manufactured under ISO 9001:2008, ISO 9001:2015, WHO-GMP, CE,
        MSME, and FDA compliance standards, and are distributed in Nepal by
        NovaCure SurgiMed.
      </p>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-eyebrow">Categories</h2>
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {CRAFTSCARE_CATEGORIES.map((category) => (
            <li key={category}>
              <Link
                href={`/craftscare/${slugify(category)}`}
                className="rounded-sm text-foreground transition-colors hover:text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-small-muted mt-4">
          Category pages with real products are built in Phase 8/9.
        </p>
      </div>
    </div>
  );
}
