import Link from "next/link";
import { FOOTER_NAV, SITE_FULL_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
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

        {/* Contact details are placeholders — real values come from the
            project owner before Phase 8 (see Phase 2 plan §4). */}
        <div className="text-body-muted mt-6">
          <p>Contact details coming soon.</p>
        </div>

        <p className="text-small-muted mt-6">
          © {new Date().getFullYear()} {SITE_FULL_NAME}.
        </p>
      </div>
    </footer>
  );
}
