"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

// Phase 13 §5 — see (site)/error.tsx's doc comment for why `error` is
// logged (not rendered) and neither `error.message` nor `error.digest`
// ever reach the page itself.
export default function AdminError({
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
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-medium text-danger">Something went wrong</p>
      <h1 className="text-page-title mt-2">We hit a snag</h1>
      <p className="text-body-muted mt-3">
        Something unexpected happened loading this page. Try again, or head back to the
        dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button href="/admin" variant="secondary">
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
