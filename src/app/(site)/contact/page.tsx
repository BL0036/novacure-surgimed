import type { Metadata } from "next";
import {
  SITE_FULL_NAME,
  CONTACT_ADDRESS,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_URL,
  CONTACT_EMAIL,
  CONTACT_HOURS,
} from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Contact ${SITE_FULL_NAME} — phone, WhatsApp, email, and address.`,
  path: "/contact",
});

// Phase 12 §3 — static page, revalidates hourly.
export const revalidate = 3600;

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <p className="text-eyebrow">Get in touch</p>
      <h1 className="text-page-title mt-2">Contact us</h1>

      <dl className="text-body-muted mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-foreground">Address</dt>
          <dd className="mt-1">{SITE_FULL_NAME}<br />{CONTACT_ADDRESS}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-foreground">Phone / WhatsApp</dt>
          <dd className="mt-1">
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {CONTACT_PHONE_DISPLAY}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-foreground">Email</dt>
          <dd className="mt-1">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {CONTACT_EMAIL}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-foreground">Business hours</dt>
          <dd className="mt-1">
            {CONTACT_HOURS.map((entry) => (
              <div key={entry.days}>
                {entry.days}: {entry.hours}
              </div>
            ))}
          </dd>
        </div>
      </dl>

      <Button
        href={CONTACT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        className="mt-8"
      >
        Message us on WhatsApp
      </Button>
    </div>
  );
}
