import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getProductForEdit,
  listCategoriesForSelect,
  listProductVariants,
} from "@/lib/admin/products";
import { listProductImages } from "@/lib/admin/images";
import { listVerificationFlags } from "@/lib/admin/verification-flags";
import {
  createVariantAction,
  updateProductAction,
  updateVariantAction,
} from "@/lib/admin/actions/products";
import { deleteImageAction, uploadImageAction } from "@/lib/admin/actions/images";
import { reopenFlagAction, resolveFlagAction } from "@/lib/admin/actions/flags";
import { Label, Input, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Edit product" };

const STATUS_OPTIONS = [
  "draft",
  "needs_verification",
  "verified",
  "published",
] as const;
const PUBLICATION_OPTIONS = ["unpublished", "published"] as const;
const STOCK_OPTIONS = ["in_stock", "out_of_stock", "discontinued", "unknown"] as const;
const VAT_OPTIONS = ["VAT", "NON_VAT"] as const;
const IMAGE_TYPE_OPTIONS = [
  "primary",
  "secondary",
  "detail",
  "packaging",
  "size_guide",
] as const;

const SELECT_CLASSES =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variantError?: string; imageError?: string }>;
}) {
  const { id } = await params;
  const { variantError, imageError } = await searchParams;

  const [product, categories, variants, images, flags] = await Promise.all([
    getProductForEdit(id),
    listCategoriesForSelect(),
    listProductVariants(id),
    listProductImages(id),
    listVerificationFlags({ productId: id }),
  ]);

  if (!product) {
    notFound();
  }

  const boundUpdateProduct = updateProductAction.bind(null, id);
  const boundCreateVariant = createVariantAction.bind(null, id);
  const boundUploadImage = uploadImageAction.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-small-muted">
        Raw catalogue name: {product.rawCatalogueName} · Slug: {product.slug}
      </p>
      <h1 className="text-page-title mt-1">{product.name}</h1>

      {/* --- Product fields --- */}
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-eyebrow">Product details</h2>
        <form action={boundUpdateProduct} className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={product.name} required />
          </div>

          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product.categoryId}
              required
              className={SELECT_CLASSES}
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
            <Input
              id="manufacturerRefCode"
              name="manufacturerRefCode"
              defaultValue={product.manufacturerRefCode ?? ""}
            />
          </div>

          <div>
            <Label htmlFor="shortDescription">Short description</Label>
            <Input
              id="shortDescription"
              name="shortDescription"
              defaultValue={product.shortDescription ?? ""}
            />
          </div>

          <div>
            <Label htmlFor="fullDescription">Full description</Label>
            <Textarea
              id="fullDescription"
              name="fullDescription"
              defaultValue={product.fullDescription ?? ""}
            />
          </div>

          <div>
            <Label htmlFor="features">Features</Label>
            <Textarea
              id="features"
              name="features"
              defaultValue={product.features ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={product.status}
                className={SELECT_CLASSES}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="publicationStatus">Publication</Label>
              <select
                id="publicationStatus"
                name="publicationStatus"
                defaultValue={product.publicationStatus}
                className={SELECT_CLASSES}
              >
                {PUBLICATION_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" className="self-start">
            Save product
          </Button>
        </form>
      </section>

      {/* --- Variants --- */}
      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-eyebrow">Variants</h2>

        {variantError ? (
          <p className="mt-3 rounded-md border border-danger bg-danger-tint px-3 py-2 text-sm text-danger">
            {variantError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-4">
          {variants.map((variant) => {
            const boundUpdateVariant = updateVariantAction.bind(null, id, variant.id);
            return (
              <form
                key={variant.id}
                action={boundUpdateVariant}
                className="rounded-lg border border-border p-4"
              >
                <p className="text-small-muted">SKU: {variant.sku}</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <Label htmlFor={`size-${variant.id}`}>Size</Label>
                    <Input
                      id={`size-${variant.id}`}
                      name="sizeLabel"
                      defaultValue={variant.sizeLabel}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`ref-${variant.id}`}>
                      Manufacturer ref code{" "}
                      <span className="font-normal text-muted">(optional)</span>
                    </Label>
                    <Input
                      id={`ref-${variant.id}`}
                      name="manufacturerRefCode"
                      defaultValue={variant.manufacturerRefCode ?? ""}
                      placeholder={product.manufacturerRefCode ?? undefined}
                    />
                    {!variant.manufacturerRefCode && product.manufacturerRefCode ? (
                      <p className="text-small-muted mt-1">
                        Falls back to product code: {product.manufacturerRefCode}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor={`mrp-${variant.id}`}>MRP</Label>
                    <Input
                      id={`mrp-${variant.id}`}
                      name="mrp"
                      type="number"
                      step="0.01"
                      defaultValue={variant.mrp}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`retail-${variant.id}`}>Retail price</Label>
                    <Input
                      id={`retail-${variant.id}`}
                      name="retailPrice"
                      type="number"
                      step="0.01"
                      defaultValue={variant.retailPrice ?? ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`stock-${variant.id}`}>Stock status</Label>
                    <select
                      id={`stock-${variant.id}`}
                      name="stockStatus"
                      defaultValue={variant.stockStatus}
                      className={SELECT_CLASSES}
                    >
                      {STOCK_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 max-w-xs">
                  <Label htmlFor={`stockist-${variant.id}`}>
                    Stockist rate{" "}
                    <span className="font-normal text-muted">
                      (internal only — never shown to customers)
                    </span>
                  </Label>
                  <Input
                    id={`stockist-${variant.id}`}
                    name="stockistRate"
                    type="number"
                    step="0.01"
                    defaultValue={variant.stockistRate ?? ""}
                  />
                </div>

                <div className="mt-3">
                  <Label htmlFor={`measurement-${variant.id}`}>
                    Size chart (JSON){" "}
                    <span className="font-normal text-muted">(optional)</span>
                  </Label>
                  <Textarea
                    id={`measurement-${variant.id}`}
                    name="measurementData"
                    defaultValue={variant.measurementData ?? ""}
                    rows={6}
                    className="font-mono text-xs"
                    placeholder={'{\n  "chestCm": [70, 80],\n  "waistCm": [60, 70]\n}'}
                  />
                  <p className="text-small-muted mt-1">
                    Must be valid JSON — invalid JSON is rejected and nothing is saved.
                  </p>
                </div>

                <Button type="submit" variant="secondary" size="sm" className="mt-3">
                  Save variant
                </Button>
              </form>
            );
          })}

          {variants.length === 0 ? (
            <p className="text-body-muted">No variants yet — add one below.</p>
          ) : null}
        </div>

        <form
          action={boundCreateVariant}
          className="mt-6 rounded-lg border border-dashed border-border p-4"
        >
          <p className="text-eyebrow">Add a variant</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <Label htmlFor="new-sizeLabel">Size</Label>
              <Input id="new-sizeLabel" name="sizeLabel" required />
            </div>
            <div>
              <Label htmlFor="new-sku">SKU</Label>
              <Input id="new-sku" name="sku" required />
            </div>
            <div>
              <Label htmlFor="new-uom">Unit of measure</Label>
              <Input id="new-uom" name="uom" required />
            </div>
            <div>
              <Label htmlFor="new-mrp">MRP</Label>
              <Input id="new-mrp" name="mrp" type="number" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="new-vatStatus">VAT status</Label>
              <select
                id="new-vatStatus"
                name="vatStatus"
                className={SELECT_CLASSES}
                defaultValue="VAT"
              >
                {VAT_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" variant="secondary" size="sm" className="mt-3">
            Add variant
          </Button>
        </form>
      </section>

      {/* --- Images --- */}
      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-eyebrow">Photos</h2>

        {imageError ? (
          <p className="mt-3 rounded-md border border-danger bg-danger-tint px-3 py-2 text-sm text-danger">
            {imageError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-4">
          {images.map((image) => {
            const boundDeleteImage = deleteImageAction.bind(null, image.id, id);
            return (
              <div
                key={image.id}
                className="w-32 rounded-lg border border-border p-2 text-center"
              >
                <Image
                  src={image.webPath}
                  alt={image.altText ?? ""}
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-md object-cover"
                />
                <p className="text-small-muted mt-1">{image.type.replace("_", " ")}</p>
                <form action={boundDeleteImage}>
                  <button
                    type="submit"
                    className="mt-1 rounded-sm text-xs text-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Delete
                  </button>
                </form>
              </div>
            );
          })}
          {images.length === 0 ? (
            <p className="text-body-muted">No photos uploaded yet.</p>
          ) : null}
        </div>

        <form action={boundUploadImage} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="file">File</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept="image/*"
              required
              className="block text-sm"
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue="primary"
              className={SELECT_CLASSES}
            >
              {IMAGE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="altText">Alt text</Label>
            <Input id="altText" name="altText" />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Upload
          </Button>
        </form>
      </section>

      {/* --- Verification flags --- */}
      {flags.length > 0 ? (
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-eyebrow">Verification flags</h2>
          <div className="mt-4 flex flex-col gap-4">
            {flags.map((flag) => {
              const boundResolve = resolveFlagAction.bind(null, flag.id, id);
              const boundReopen = reopenFlagAction.bind(null, flag.id, id);
              return (
                <div key={flag.id} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium text-foreground">
                    {flag.issueType}{" "}
                    {flag.resolved ? (
                      <span className="text-success">— resolved</span>
                    ) : (
                      <span className="text-warning">— open</span>
                    )}
                  </p>
                  {flag.note ? (
                    <p className="text-body-muted mt-1">{flag.note}</p>
                  ) : null}

                  {flag.resolved ? (
                    <>
                      {flag.resolutionNote ? (
                        <p className="mt-2 text-sm text-foreground">
                          Resolution: {flag.resolutionNote}
                        </p>
                      ) : null}
                      <form action={boundReopen}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                        >
                          Reopen
                        </Button>
                      </form>
                    </>
                  ) : (
                    <form action={boundResolve} className="mt-3 flex flex-col gap-2">
                      <Label htmlFor={`resolution-${flag.id}`}>Resolution note</Label>
                      <Textarea id={`resolution-${flag.id}`} name="resolutionNote" />
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        className="self-start"
                      >
                        Mark resolved
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
