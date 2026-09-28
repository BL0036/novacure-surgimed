import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Page not found",
  description: "The page you're looking for doesn't exist.",
  path: "/404",
  noIndex: true,
});

// Renders for any unresolved route under (site) — an unknown product,
// category, or brand slug calling notFound() (see catalog.ts callers),
// or any other unmatched path under this segment. Wrapped by
// (site)/layout.tsx like any other page, so the header/footer still
// show — a dead end shouldn't also strand the visitor without nav.
export default function SiteNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-medium text-link">404</p>
      <h1 className="text-page-title mt-2">Page not found</h1>
      <p className="text-body-muted mt-3">
        We couldn&rsquo;t find the page you were looking for. It may have been moved, or
        the link may be out of date.
      </p>
      <div className="mt-6 flex gap-3">
        <Button href="/">Go to homepage</Button>
        <Button href="/shop" variant="secondary">
          Browse products
        </Button>
      </div>
    </div>
  );
}
