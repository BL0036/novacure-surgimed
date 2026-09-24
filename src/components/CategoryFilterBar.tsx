import Link from "next/link";
import { buildQueryString } from "@/lib/query-string";
import type { CategorySort } from "@/lib/catalog";

const SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
];

interface CategoryFilterBarProps {
  basePath: string;
  sort: CategorySort;
  sizeLabel?: string;
  availableSizes: string[];
}

// Sort + size filters (Phase 4 plan §2). Sort options are name/price
// only — no "popularity" sort, since there's no order/sales data to
// base one on. Size options come from getCategorySizeLabels() (real
// ProductVariant data), never a hardcoded list.
export function CategoryFilterBar({
  basePath,
  sort,
  sizeLabel,
  availableSizes,
}: CategoryFilterBarProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-border py-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted">Sort:</span>
        {SORT_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`${basePath}${buildQueryString({
              sort: option.value === "name" ? undefined : option.value,
              size: sizeLabel,
            })}`}
            className={
              sort === option.value
                ? "rounded-md bg-brand px-2.5 py-1 font-medium text-white"
                : "rounded-md px-2.5 py-1 text-foreground hover:bg-brand-tint"
            }
          >
            {option.label}
          </Link>
        ))}
      </div>

      {availableSizes.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted">Size:</span>
          <Link
            href={`${basePath}${buildQueryString({
              sort: sort === "name" ? undefined : sort,
            })}`}
            className={
              !sizeLabel
                ? "rounded-md bg-brand px-2.5 py-1 font-medium text-white"
                : "rounded-md px-2.5 py-1 text-foreground hover:bg-brand-tint"
            }
          >
            All
          </Link>
          {availableSizes.map((size) => (
            <Link
              key={size}
              href={`${basePath}${buildQueryString({
                sort: sort === "name" ? undefined : sort,
                size,
              })}`}
              className={
                sizeLabel === size
                  ? "rounded-md bg-brand px-2.5 py-1 font-medium text-white"
                  : "rounded-md px-2.5 py-1 text-foreground hover:bg-brand-tint"
              }
            >
              {size}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
