import type { Metadata } from "next";
import type { ReactNode } from "react";
import { geistSans, geistMono } from "@/lib/fonts";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { SITE_FULL_NAME } from "@/lib/site";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { organizationJsonLd } from "@/lib/structured-data";
import "../globals.css";

export const metadata: Metadata = {
  // Phase 12 §1 — base URL for every URL-based metadata field (canonical,
  // og:url, og:image, twitter:image) in this route segment and below.
  // buildMetadata() already builds fully-qualified URLs itself, so this
  // mostly matters as a safety net (any relative URL Next.js metadata
  // field added later resolves correctly instead of erroring) and to
  // silence Next's "no metadataBase" warning. See src/lib/seo.ts for the
  // production-domain TODO.
  metadataBase: new URL(SITE_URL),
  ...buildMetadata({
    title: SITE_FULL_NAME,
    description:
      "NovaCure SurgiMed Suppliers — a multi-brand healthcare and orthopaedic product platform in Nepal.",
    path: "/",
  }),
  title: {
    default: SITE_FULL_NAME,
    template: `%s | ${SITE_FULL_NAME}`,
  },
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <JsonLd data={organizationJsonLd()} />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
