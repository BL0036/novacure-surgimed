import { CRAFTSCARE_CATEGORIES } from "@/lib/site";

export default function CraftscareBrandPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <p className="text-sm font-medium text-brand">Brand</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Craftscare
      </h1>
      <p className="mt-3 text-sm text-muted">
        Brand story coming soon — this page will carry the About Craftscare
        content once it&rsquo;s written (see Phase 2 plan §4). It is not
        invented here.
      </p>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Categories
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {CRAFTSCARE_CATEGORIES.map((category) => (
            <li key={category} className="text-foreground">
              {category}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Category pages with real products are built in Phase 8/9.
        </p>
      </div>
    </div>
  );
}
