import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardCounts } from "@/lib/admin/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

const CARDS = [
  { key: "totalProducts", label: "Products", href: "/admin/products" },
  { key: "publishedProducts", label: "Published", href: "/admin/products" },
  {
    key: "unresolvedFlags",
    label: "Unresolved flags",
    href: "/admin/verification-flags",
  },
  { key: "pendingImages", label: "Photos pending", href: "/admin/products" },
  { key: "newEnquiries", label: "New enquiries", href: "/admin/enquiries" },
] as const;

export default async function AdminDashboardPage() {
  const counts = await getDashboardCounts();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-page-title">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-lg border border-border px-4 py-4 transition-colors hover:border-brand hover:bg-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {counts[card.key]}
            </p>
            <p className="text-body-muted mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-eyebrow">Quick actions</h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          <li>
            <Link href="/admin/products/new" className="text-link hover:underline">
              + Add a new product
            </Link>
          </li>
          <li>
            <Link
              href="/admin/verification-flags"
              className="text-link hover:underline"
            >
              Review unresolved verification flags
            </Link>
          </li>
          <li>
            <Link href="/admin/enquiries?status=new" className="text-link hover:underline">
              Review new enquiries
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
