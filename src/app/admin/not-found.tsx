import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Not found — NovaCure Admin",
  robots: { index: false, follow: false },
};

// Renders when notFound() is thrown by a page inside (protected) — an
// unknown product/enquiry id (see the products/[id] and enquiries/[id]
// pages). Verified live: (protected)/layout.tsx's nav/auth check has
// already run successfully by the time the page itself throws, so this
// renders wrapped by the real admin nav (Dashboard/Log out are visible),
// not bare. An arbitrary unmatched /admin/* URL that matches no page at
// all (a typo'd path) does NOT reach this file — verified live that it
// falls through to the top-level global-not-found.tsx instead, since no
// admin route segment matched at all for Next to hang this boundary off
// of. "Go to dashboard" is still always a safe link either way.
export default function AdminNotFound() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="text-page-title mt-2">Not found</h1>
      <p className="text-body-muted mt-3">
        That admin page doesn&rsquo;t exist, or the item it points to may have been
        deleted.
      </p>
      <Button href="/admin" className="mt-6">
        Go to dashboard
      </Button>
    </div>
  );
}
