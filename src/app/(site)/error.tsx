"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

// Phase 13 §5 — catches any uncaught exception thrown while rendering a
// (site) page (below (site)/layout.tsx, which keeps rendering normally
// around this — header/footer stay visible). Deliberately never renders
// `error.message` or any other field of `error` in the UI: Next.js
// already replaces a Server Component error's message with a generic
// one + a digest in production (see Next's error.js docs), but a
// Client Component error still carries its real message here, so the
// only way to guarantee nothing internal ever reaches a visitor is to
// not print any part of `error` at all. `error.digest` is logged to the
// console (visible to whoever's watching server/browser logs, not
// rendered on the page) so a real incident is still traceable.
export default function SiteError({
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
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-medium text-danger">Something went wrong</p>
      <h1 className="text-page-title mt-2">We hit a snag</h1>
      <p className="text-body-muted mt-3">
        Something unexpected happened on our end. Please try again — if it keeps
        happening, reach out and we&rsquo;ll take a look.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button href="/" variant="secondary">
          Go to homepage
        </Button>
      </div>
    </div>
  );
}
