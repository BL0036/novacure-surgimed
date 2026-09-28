import Link from "next/link";
import {
  FOOTER_NAV,
  SITE_FULL_NAME,
  CONTACT_ADDRESS,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_URL,
  CONTACT_EMAIL,
} from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="page-container py-10">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {FOOTER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="text-body-muted mt-6 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-1">
          <span>{CONTACT_ADDRESS}</span>
          <a
            href={`tel:${CONTACT_PHONE_TEL}`}
            className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
          <a
            href={CONTACT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            WhatsApp
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <p className="text-small-muted mt-6">
          © {new Date().getFullYear()} {SITE_FULL_NAME}.
        </p>
      </div>
    </footer>
  );
}
