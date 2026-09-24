import Image from "next/image";
import Link from "next/link";
import { PRIMARY_NAV, SITE_NAME } from "@/lib/site";
import { SearchForm } from "@/components/SearchForm";
import { MobileNav } from "@/components/MobileNav";

export function SiteHeader() {
  return (
    <header className="relative border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/brand/novacure-logo.png"
            alt={`${SITE_NAME} logo`}
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {SITE_NAME}
          </span>
        </Link>

        {/* Desktop nav (lg+) — Phase 5 polish: consistent link spacing
            and a focus-visible ring on top of the existing hover state. */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
        >
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SearchForm className="hidden w-48 shrink-0 lg:block" />

        {/* Below lg: hamburger menu replaces the old "wraps below
            header" nav block + separate mobile search row. */}
        <MobileNav />
      </div>
    </header>
  );
}
