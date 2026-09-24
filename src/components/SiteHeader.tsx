import Image from "next/image";
import Link from "next/link";
import { PRIMARY_NAV, SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#050b23] p-1">
            <Image
              src="/brand/novacure-logo.png"
              alt={`${SITE_NAME} logo`}
              width={28}
              height={28}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {SITE_NAME}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden lg:flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
        >
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile / narrow-viewport nav — same links, wraps below the logo row */}
      <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-5 gap-y-2 px-6 pb-4 text-sm lg:hidden">
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
