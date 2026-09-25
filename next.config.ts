import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
