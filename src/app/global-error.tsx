"use client";

import { useEffect } from "react";
import { geistSans, geistMono } from "@/lib/fonts";
import { Button } from "@/components/ui/Button";
import "./globals.css";

// Phase 13 §5 — catches an error thrown by (site)/layout.tsx or
// admin/layout.tsx itself, which their own segment's error.tsx can't
// catch (error.js wraps the page/nested layouts below it, not the
// layout in its own segment — see Next's error.js docs "Good to
// know"). This is a rare, last-resort fallback: the two root layouts
// here are simple enough (no data fetching of their own beyond
// JsonLd's static organization data) that this should only ever fire
// for something like a font-loading failure or a genuine framework bug.
// Self-contained (own html/body/styles) for the same reason
// global-not-found.tsx is — nothing above this renders when it's active.
// Same reasoning as (site)/error.tsx re: never rendering error.message.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col items-center justify-center bg-background px-6 py-20 text-center text-foreground">
        <p className="text-sm font-medium text-danger">Something went wrong</p>
        <h1 className="text-page-title mt-2">We hit a snag</h1>
        <p className="text-body-muted mt-3 max-w-sm">
          Something unexpected happened. Please try again — if it keeps happening, reach
          out and we&rsquo;ll take a look.
        </p>
        <Button onClick={() => retry()} className="mt-6">
          Try again
        </Button>
      </body>
    </html>
  );
}
