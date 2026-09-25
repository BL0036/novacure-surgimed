"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { ProductVariantSummary } from "@/lib/catalog";
import { Button } from "@/components/ui/Button";
import { SizeChart } from "@/components/SizeChart";

interface VariantSelectorProps {
  variants: ProductVariantSummary[];
  /** Product-level manufacturerRefCode, used when a variant doesn't have
   *  its own — same fallback the admin form already uses (Phase 9 §3). */
  productManufacturerRefCode: string | null;
}

// Phase 8 §4 — real ProductVariant price/stock data, display only. There's
// no cart/ordering system yet (Phase 11), so this just lets the visitor
// switch which size's price and stock status they're looking at; it
// doesn't submit anything.
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
}: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) {
    return (
      <p className="text-body-muted">
        No sizes are currently listed for this product.
      </p>
    );
  }

  const refCode = selected.manufacturerRefCode ?? productManufacturerRefCode;

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
    </div>
  );
}
