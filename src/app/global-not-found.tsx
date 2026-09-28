import { geistSans, geistMono } from "@/lib/fonts";
import { SITE_FULL_NAME } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/Button";
import "./globals.css";

// Phase 13 §5 — this file bypasses both of this app's root layouts
// entirely (see next.config.ts's `experimental.globalNotFound` comment),
// so it has to import its own global styles/fonts and can't reuse
// SiteHeader/SiteFooter or any Server Component data fetching most
// pages rely on — it's intentionally minimal. It only ever renders for
// a URL that matches neither the (site) nor the admin segment (a typo'd
// path, an old bookmark, etc.); notFound() calls from *inside* a page
// (an unknown product slug, an unknown admin ID) render the closer
// (site)/not-found.tsx or admin/not-found.tsx instead, wrapped in that
// segment's own layout.
export const metadata = buildMetadata({
  title: `Page not found | ${SITE_FULL_NAME}`,
  description: "The page you're looking for doesn't exist.",
  path: "/404",
  noIndex: true,
});

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col items-center justify-center bg-background px-6 py-20 text-center text-foreground">
        <p className="text-sm font-medium text-link">404</p>
        <h1 className="text-page-title mt-2">Page not found</h1>
        <p className="text-body-muted mt-3 max-w-sm">
          The page you&rsquo;re looking for doesn&rsquo;t exist, or may have moved.
        </p>
        <Button href="/" className="mt-6">
          Go to homepage
        </Button>
      </body>
    </html>
  );
}
