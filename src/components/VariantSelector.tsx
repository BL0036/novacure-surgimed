"use client";

import { useState } from "react";
import { formatPrice, resolveVariantRefCode } from "@/lib/format";
import type { ProductVariantSummary } from "@/lib/catalog";
import { buildWhatsAppOrderUrl } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { SizeChart } from "@/components/SizeChart";
import { EnquiryForm } from "@/components/EnquiryForm";

interface VariantSelectorProps {
  variants: ProductVariantSummary[];
  /** Product-level manufacturerRefCode, used when a variant doesn't have
   *  its own — same fallback the admin form already uses (Phase 9 §3). */
  productManufacturerRefCode: string | null;
  /** Phase 11 §2 — needed for the WhatsApp pre-filled message and to
   *  attach the "Request this product" enquiry to the right product. */
  productId: string;
  productName: string;
  /** Full absolute URL (SITE_URL + path), included in the WhatsApp
   *  message so the person on the other end can open the exact page. */
  productUrl: string;
}

// Phase 8 §4 — real ProductVariant price/stock data, display only, plus
// Phase 11 §2's two order-lead CTAs (WhatsApp / "Request this product").
// Still no cart/payment — see README "Phase 11 decisions".
const STOCK_LABEL: Record<ProductVariantSummary["stockStatus"], string> = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  discontinued: "Discontinued",
  unknown: "Availability on request",
};

const STOCK_CLASSES: Record<ProductVariantSummary["stockStatus"], string> = {
  in_stock: "bg-success-tint text-success",
  out_of_stock: "bg-warning-tint text-warning",
  discontinued: "bg-danger-tint text-danger",
  unknown: "bg-brand-tint text-muted",
};

export function VariantSelector({
  variants,
  productManufacturerRefCode,
  productId,
  productName,
  productUrl,
}: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [showForm, setShowForm] = useState(false);
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) {
    return (
      <p className="text-body-muted">No sizes are currently listed for this product.</p>
    );
  }

  const refCode = resolveVariantRefCode(
    selected.manufacturerRefCode,
    productManufacturerRefCode,
  );

  const whatsAppMessage = `Hi, I'd like to order: ${productName} (${selected.sizeLabel}).\n${productUrl}`;

  return (
    <div>
      {variants.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <Button
              key={variant.id}
              type="button"
              variant="secondary"
              size="sm"
              active={variant.id === selected.id}
              aria-pressed={variant.id === selected.id}
              onClick={() => setSelectedId(variant.id)}
            >
              {variant.sizeLabel}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-eyebrow">{selected.sizeLabel}</p>
      )}

      <p className="mt-4 text-2xl font-semibold text-foreground">
        {formatPrice(selected.retailPrice)}
      </p>
      <p className="text-small-muted mt-1">
        SKU {selected.sku} &middot; {selected.uom}
        {refCode ? <> &middot; Ref {refCode}</> : null}
      </p>

      <span
        className={`mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${STOCK_CLASSES[selected.stockStatus]}`}
      >
        {STOCK_LABEL[selected.stockStatus]}
      </span>

      <SizeChart data={selected.measurementData} />

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-6">
        <Button
          href={buildWhatsAppOrderUrl(whatsAppMessage)}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
        >
          Order via WhatsApp
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
        >
          {showForm ? "Hide request form" : "Request this product"}
        </Button>
      </div>

      {showForm ? (
        <div className="mt-4 rounded-lg border border-border p-4">
          <EnquiryForm productId={productId} variantId={selected.id} />
        </div>
      ) : null}
    </div>
  );
}
