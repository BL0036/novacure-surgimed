import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Guides & Resources",
  description:
    "Buying guides and educational content from NovaCure Surgimed Suppliers.",
  path: "/guides",
  noIndex: true,
});

export default function GuidesPage() {
  return (
    <ComingSoon
      title="Guides & Resources — coming soon"
      note="Educational content and buying guides. Empty for now — populated in Phase 3."
    />
  );
}
