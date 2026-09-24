import Link from "next/link";
import type { Metadata } from "next";
import { BRANDS } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Brands",
  description:
    "Brands carried on the NovaCure Surgimed Suppliers platform.",
  path: "/brands",
});

export default function BrandsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-page-title">Brands</h1>
      <p className="text-body-muted mt-3">
        Brands carried on the NovaCure platform. Each brand has its own
        categories and products, scoped independently.
      </p>

      <ul className="mt-8 space-y-3">
        {BRANDS.map((brand) => (
          <li key={brand.slug}>
            <Link
              href={`/brands/${brand.slug}`}
              className="block rounded-lg border border-border px-5 py-4 transition-colors hover:bg-brand-tint"
            >
              <span className="font-medium text-foreground">
                {brand.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
