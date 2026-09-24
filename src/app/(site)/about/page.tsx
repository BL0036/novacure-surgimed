import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: "About NovaCure Surgimed Suppliers.",
  path: "/about",
  noIndex: true,
});

export default function AboutPage() {
  return (
    <ComingSoon
      title="About NovaCure — content coming soon"
      note="Company history and background go here once written by the project owner. Not invented here."
    />
  );
}
