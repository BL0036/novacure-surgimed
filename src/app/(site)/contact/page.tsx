import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Contact NovaCure Surgimed Suppliers.",
  path: "/contact",
  noIndex: true,
});

export default function ContactPage() {
  return (
    <ComingSoon
      title="Contact — content coming soon"
      note="Phone, WhatsApp, email, and address will appear here once provided by the project owner."
    />
  );
}
