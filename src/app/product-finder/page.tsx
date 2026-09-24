import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Product Finder",
  description: "Guided product-finder tool.",
  path: "/product-finder",
  noIndex: true,
});

export default function ProductFinderPage() {
  return (
    <ComingSoon
      title="Product Finder — coming soon"
      note="Guided product-finder tool. Placeholder route only — built in Phase 10."
    />
  );
}
