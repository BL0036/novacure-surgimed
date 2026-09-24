import { Label, Input } from "@/components/ui/FormField";

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
      <Label htmlFor="site-search" srOnly>
        Search products
      </Label>
      <Input
        id="site-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search products…"
        className="py-1.5"
      />
    </form>
  );
}
