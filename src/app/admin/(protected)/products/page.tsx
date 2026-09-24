import type { Metadata } from "next";
import Link from "next/link";
import { Label, Input } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { listProductsAdmin } from "@/lib/admin/products";

export const metadata: Metadata = { title: "Products" };

const STATUS_BADGE: Record<string, string> = {
  draft: "text-muted",
  needs_verification: "text-warning",
  verified: "text-brand",
  published: "text-success",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  const { products, total } = await listProductsAdmin({
    query: q,
    sort: sort === "name" || sort === "status" ? sort : "updated",
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-page-title">Products</h1>
        <Button href="/admin/products/new" size="sm">
          + New product
        </Button>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" action="/admin/products">
        <div className="max-w-xs flex-1">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Name or ref code…"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      <p className="text-small-muted mt-4">
        {total} product{total === 1 ? "" : "s"}
        {q ? ` matching "${q}"` : ""}
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-brand-tint text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Category</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Published</th>
              <th className="px-4 py-2 font-semibold">Variants</th>
              <th className="px-4 py-2 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-brand-tint">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="hover:text-brand hover:underline"
                  >
                    {product.name}
                  </Link>
                </td>
                <td className="text-body-muted px-4 py-2.5">{product.categoryName}</td>
                <td
                  className={`px-4 py-2.5 font-medium ${STATUS_BADGE[product.status] ?? ""}`}
                >
                  {product.status.replace("_", " ")}
                </td>
                <td className="px-4 py-2.5">
                  {product.publicationStatus === "published" ? (
                    <span className="text-success">Published</span>
                  ) : (
                    <span className="text-muted">Unpublished</span>
                  )}
                </td>
                <td className="text-body-muted px-4 py-2.5">{product.variantCount}</td>
                <td className="text-small-muted px-4 py-2.5">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-body-muted px-4 py-6 text-center">
                  No products found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
