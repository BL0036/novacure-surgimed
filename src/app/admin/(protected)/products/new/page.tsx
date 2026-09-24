import type { Metadata } from "next";
import { createProductAction } from "@/lib/admin/actions/products";
import { listCategoriesForSelect } from "@/lib/admin/products";
import { Label, Input } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const categories = await listCategoriesForSelect();

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <h1 className="text-page-title">New product</h1>
      <p className="text-body-muted mt-2">
        Creates the product record only — add variants (size/price/SKU) on the edit page
        afterward.
      </p>

      {error === "no-brand" ? (
        <p className="mt-4 rounded-md border border-danger bg-danger-tint px-3 py-2 text-sm text-danger">
          No brand exists yet in the database — run{" "}
          <code className="font-mono">npm run db:seed-brand</code> first.
        </p>
      ) : null}

      {categories.length === 0 ? (
        <p className="mt-4 rounded-md border border-warning bg-warning-tint px-3 py-2 text-sm text-warning">
          No categories exist yet, so a product can&rsquo;t be assigned one. Import the
          catalogue or run the category seed script first.
        </p>
      ) : (
        <form action={createProductAction} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>

          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brandName} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="manufacturerRefCode">Manufacturer ref code</Label>
            <Input id="manufacturerRefCode" name="manufacturerRefCode" />
          </div>

          <div>
            <Label htmlFor="shortDescription">Short description</Label>
            <Input id="shortDescription" name="shortDescription" />
          </div>

          <Button type="submit" className="self-start">
            Create product
          </Button>
        </form>
      )}
    </div>
  );
}
