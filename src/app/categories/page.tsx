import { CRAFTSCARE_CATEGORIES } from "@/lib/site";

// Flattened shortcut from the header nav (Master Plan §11). Currently
// mirrors Craftscare's categories 1:1 since it's the only brand; once a
// second brand exists this becomes a real cross-brand aggregate.
export default function CategoriesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <p className="mt-3 text-sm text-muted">
        All categories across carried brands. Currently these are
        Craftscare&rsquo;s categories only.
      </p>

      <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {CRAFTSCARE_CATEGORIES.map((category) => (
          <li key={category} className="text-foreground">
            {category}
          </li>
        ))}
      </ul>
    </div>
  );
}
