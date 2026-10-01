import type { Metadata } from "next";
import Link from "next/link";
import { listProductsAdmin } from "@/lib/admin/products";
import { BulkImageUploader } from "@/components/admin/BulkImageUploader";

export const metadata: Metadata = { title: "Bulk upload images" };

// Phase 14 — bulk image upload. Separate page rather than a section on
// /admin/products/[id] (Phase 8) because this handles many products in one
// pass; that page's per-product image form (Phase 8/13) is unchanged and
// still the right place to manage one product's photos individually.
export default async function BulkImagesPage() {
  const { products } = await listProductsAdmin({ sort: "name" });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/admin/products" className="text-small-muted hover:text-foreground">
        ← Back to Products
      </Link>
      <h1 className="text-page-title mt-2">Bulk upload images</h1>
      <p className="text-body-muted mt-1 max-w-2xl">
        Add several photos at once. If a file is named like{" "}
        <code className="rounded bg-brand-tint px-1 py-0.5 text-sm">
          08__Category__Product-Name__primary.jpg
        </code>
        , the product and type are filled in automatically — just glance through to confirm
        before uploading. Anything else (like a plain camera filename) is left for you to
        pick by hand.
      </p>

      <div className="mt-8">
        <BulkImageUploader
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            categoryName: p.categoryName,
          }))}
        />
      </div>
    </div>
  );
}
