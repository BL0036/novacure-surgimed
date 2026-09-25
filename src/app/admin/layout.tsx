import type { Metadata } from "next";
import type { ReactNode } from "react";
import { geistSans, geistMono } from "@/lib/fonts";
import "../globals.css";

// Phase 7 — deliberately its own root layout (separate <html>/<body> via
// Next.js's multiple-root-layouts pattern), not nested inside the
// customer-facing (site) layout. An internal tool shouldn't render the
// public SiteHeader/SiteFooter/organization JSON-LD around it, and it
// should never be indexed. See "Phase 7 decisions" in README.
export const metadata: Metadata = {
  title: "Admin — NovaCure SurgiMed Suppliers",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
