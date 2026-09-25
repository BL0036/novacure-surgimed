import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shop",
  description:
    "Browse products across all brands carried by NovaCure SurgiMed Suppliers.",
  path: "/shop",
  noIndex: true,
});

export default function ShopPage() {
  return (
    <ComingSoon
      title="Shop — content coming soon"
      note="This will list products across all carried brands. While Craftscare is the only brand, it defaults to the Craftscare catalogue (Phase 8/9)."
    />
  );
}
