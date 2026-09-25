import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "For Hospitals & Pharmacies",
  description: "Wholesale and institutional enquiries for NovaCure SurgiMed Suppliers.",
  path: "/for-hospitals-pharmacies",
  noIndex: true,
});

export default function ForHospitalsPharmaciesPage() {
  return (
    <ComingSoon
      title="For Hospitals & Pharmacies — content coming soon"
      note="B2B enquiry messaging placeholder. The full wholesale/business-account system is a later, separate phase — this page is simple messaging only."
    />
  );
}
