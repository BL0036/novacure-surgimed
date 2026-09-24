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

// Phase 4 §6 — structure only, no Guide model exists yet in the schema
// and no article content is written here. FAQPage schema (Phase 3) is
// applied per-guide once real Q&A-formatted articles exist (Phase 9+).
export default function GuidesPage() {
  return (
    <ComingSoon
      title="Guides & Resources"
      note="No guides published yet. Buying guides and educational content are written in a later phase."
    />
  );
}
