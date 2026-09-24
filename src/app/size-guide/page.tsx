import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Size Guide",
  description: "General and per-product size guidance.",
  path: "/size-guide",
  noIndex: true,
});

export default function SizeGuidePage() {
  return (
    <ComingSoon
      title="Size Guide — coming soon"
      note="General and per-product size guidance. Placeholder route only — built in Phase 10."
    />
  );
}
