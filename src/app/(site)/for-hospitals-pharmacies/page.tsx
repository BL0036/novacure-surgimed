import type { Metadata } from "next";
import { CONTACT_WHATSAPP_URL, CONTACT_PHONE_DISPLAY, CONTACT_EMAIL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = buildMetadata({
  title: "For Hospitals & Pharmacies",
  description: "Wholesale and institutional enquiries for NovaCure SurgiMed Suppliers.",
  path: "/for-hospitals-pharmacies",
  noIndex: true,
});

// Phase 12 §3 — static page, revalidates hourly. The embedded
// EnquiryForm is a Client Component that submits via a Server Action at
// interaction time, not at render time — it doesn't touch the database
// during the page's own server render, so it doesn't affect this page's
// cacheability.
export const revalidate = 3600;

// Phase 11 §3 — real enquiry messaging for hospitals/pharmacies, replacing
// the Phase 2/8 ComingSoon placeholder. This is the same general-purpose
// enquiry form used elsewhere (Phase 11 §2b), not attached to a specific
// product, with organizationName shown and relabeled for this audience.
// A full wholesale/business-account system (bulk pricing, credit terms,
// a separate login) is still a later, separate phase — this page is
// enquiry intake only, same as the request stated.
export default function ForHospitalsPharmaciesPage() {
  return (
    <div className="page-container-narrow py-20">
      <p className="text-eyebrow">Wholesale &amp; institutional</p>
      <h1 className="text-page-title mt-2">For Hospitals &amp; Pharmacies</h1>
      <p className="text-body-muted mt-3">
        Ordering Craftscare orthopaedic products for a hospital, clinic, or pharmacy?
        Send us your requirements below, or reach us directly on WhatsApp or phone, and
        we&rsquo;ll follow up to confirm availability, pricing, and delivery.
      </p>

      <Button
        href={CONTACT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        className="mt-6"
      >
        Message us on WhatsApp
      </Button>
      <p className="text-small-muted mt-2">
        Or call {CONTACT_PHONE_DISPLAY} / email{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <div className="mt-10 border-t border-border pt-8">
        <h2 className="text-section-heading">Send an enquiry</h2>
        <div className="mt-4">
          {/* Phase 13 §2: deliberately impure below. This computes the
              Server Component's render time, baked into the HTML as the
              enquiry form's min-submit-time anti-spam timestamp (see
              EnquiryForm's `renderedAt` prop doc comment). It's a
              one-shot value for this render/regeneration of an ISR page,
              not something React Compiler would try to memoize away
              across client re-renders — EnquiryForm's own client-side
              effect further corrects for ISR staleness, see its doc
              comment. */}
          <EnquiryForm
            showOrganization
            organizationLabel="Hospital/Pharmacy name"
            // eslint-disable-next-line react-hooks/purity
            renderedAt={Date.now()}
          />
        </div>
      </div>
    </div>
  );
}
