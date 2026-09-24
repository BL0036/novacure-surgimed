interface SearchFormProps {
  className?: string;
  defaultValue?: string;
}

// Basic substring search (Phase 4 plan §3) — no autosuggest/autocomplete
// at launch. Plain GET form so results are a real, shareable, crawlable
// /search?q=... URL rather than client-only state.
export function SearchForm({ className, defaultValue }: SearchFormProps) {
  return (
    <form action="/search" method="get" role="search" className={className}>
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search products…"
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none"
      />
    </form>
  );
}
