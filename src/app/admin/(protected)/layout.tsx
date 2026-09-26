import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/session";
import { logoutAction } from "@/lib/admin/actions/auth";
import { Button } from "@/components/ui/Button";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/verification-flags", label: "Verification flags" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Every route nested under this layout requires a valid session —
  // this one check covers all of them. /admin/login sits outside this
  // route group, so it's never gated by it.
  const session = await requireAdminSession();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              NovaCure Admin
            </span>
            <nav aria-label="Admin" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-body-muted">{session.email}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
