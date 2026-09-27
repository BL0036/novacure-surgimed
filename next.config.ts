import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phase 13 §5 — this app has two separate root layouts ((site) and
  // admin, each with their own <html>/<body> — see "Phase 7 decisions"
  // in README), so there's no single root layout to compose a global
  // 404 from the normal way. globalNotFound lets app/global-not-found.tsx
  // handle any URL that matches neither segment, without needing a
  // third, redundant root layout just to host it. See
  // app/global-not-found.tsx and README "Phase 13 decisions".
  experimental: {
    globalNotFound: true,
  },
  images: {
    // Phase 8 — product photos are served from Vercel Blob once uploaded
    // via the admin (see src/lib/admin/images.ts). Every store's public
    // blobs live under a `<store-id>.public.blob.vercel-storage.com`
    // subdomain, so this is a wildcard on that suffix rather than one
    // fixed hostname.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
