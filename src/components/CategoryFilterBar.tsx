import { buildQueryString } from "@/lib/query-string";
import type { CategorySort } from "@/lib/catalog";
import { Button } from "@/components/ui/Button";

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
function FilterContent({
  basePath,
  sort,
  sizeLabel,
  availableSizes,
}: CategoryFilterBarProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted">Sort:</span>
        {SORT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            href={`${basePath}${buildQueryString({
              sort: option.value === "name" ? undefined : option.value,
              size: sizeLabel,
            })}`}
            variant="ghost"
            size="sm"
            active={sort === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {availableSizes.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted">Size:</span>
          <Button
            href={`${basePath}${buildQueryString({
              sort: sort === "name" ? undefined : sort,
            })}`}
            variant="ghost"
            size="sm"
            active={!sizeLabel}
          >
            All
          </Button>
          {availableSizes.map((size) => (
            <Button
              key={size}
              href={`${basePath}${buildQueryString({
                sort: sort === "name" ? undefined : sort,
                size,
              })}`}
              variant="ghost"
              size="sm"
              active={sizeLabel === size}
            >
              {size}
            </Button>
          ))}
        </div>
      ) : null}
    </>
  );
}

// Phase 5 §6 — mobile gets a real collapsed pattern (native <details>,
// no client JS needed) instead of the bar just wrapping onto more
// lines. Rendered twice (desktop inline vs. mobile accordion) rather
// than toggled with one CSS breakpoint, because a <details> element's
// open/closed state is controlled by the browser itself, independent of
// display:contents — trying to force it "always open" at sm+ with CSS
// alone is unreliable across browsers.
export function CategoryFilterBar(props: CategoryFilterBarProps) {
  return (
    <>
      <div className="mt-6 hidden flex-wrap items-center gap-x-8 gap-y-4 border-y border-border py-4 text-sm sm:flex">
        <FilterContent {...props} />
      </div>

      <details className="group mt-6 border-y border-border text-sm sm:hidden">
        <summary className="flex cursor-pointer items-center justify-between py-4 font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
          <span>Sort &amp; filter</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>
        <div className="flex flex-col gap-4 pb-4">
          <FilterContent {...props} />
        </div>
      </details>
    </>
  );
}
