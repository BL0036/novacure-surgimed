"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImageSummary } from "@/lib/catalog";

interface ProductGalleryProps {
  images: ProductImageSummary[];
  productName: string;
}

function PlaceholderBlock() {
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-tint text-muted">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-16 w-16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5.5-5.5L3 20" />
      </svg>
      <span className="sr-only">Product photo pending</span>
    </div>
  );
}

// Phase 8 §4 — real gallery component, ready for real photos once Phase 9
// uploads them (via the Phase 8 Vercel Blob image pipeline). Until then
// `images` is empty for every product (Phase 1 decision #6 — no
// ProductImage rows exist), so this always renders PlaceholderBlock; no
// separate "no photos yet" code path is needed once real images exist,
// this component already handles both.
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <PlaceholderBlock />;
  }

  const active = images[activeIndex];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-brand-tint">
        <Image
          src={active.webPath}
          alt={active.altText ?? productName}
          fill
          sizes="(min-width: 1024px) 480px, 100vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-current={index === activeIndex}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                index === activeIndex ? "border-brand" : "border-border"
              }`}
            >
              <Image
                src={image.webPath}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
