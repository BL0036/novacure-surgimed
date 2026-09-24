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
    "Craftscare orthopaedic products, carried by NovaCure Surgimed Suppliers in Nepal.",
  path: "/brands/craftscare",
});

export default function CraftscareBrandPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Brands", path: "/brands" },
          { name: "Craftscare", path: "/brands/craftscare" },
        ])}
      />
      <p className="text-sm font-medium text-brand">Brand</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Craftscare
      </h1>
      <p className="mt-3 text-sm text-muted">
        Brand story coming soon — this page will carry the About Craftscare
        content once it&rsquo;s written (see Phase 2 plan §4). It is not
        invented here.
      </p>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Categories
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {CRAFTSCARE_CATEGORIES.map((category) => (
            <li key={category}>
              <Link
                href={`/craftscare/${slugify(category)}`}
                className="text-foreground hover:text-brand hover:underline"
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Category pages with real products are built in Phase 8/9.
        </p>
      </div>
    </div>
  );
}
