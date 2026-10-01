"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  bulkUploadImagesAction,
  type BulkUploadResult,
} from "@/lib/admin/actions/bulk-images";

export interface BulkProductOption {
  id: string;
  name: string;
  categoryName: string;
}

interface Row {
  key: string;
  file: File;
  previewUrl: string;
  productId: string;
  type: "primary" | "secondary" | "detail" | "packaging" | "size_guide";
  altText: string;
  autoMatched: boolean;
}

const IMAGE_TYPES = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "detail", label: "Detail" },
  { value: "packaging", label: "Packaging" },
  { value: "size_guide", label: "Size guide" },
] as const;
const VALID_TYPES = new Set(IMAGE_TYPES.map((t) => t.value as string));

// Matches the "<seq>__<category>__<product>__<type>.<ext>" naming produced
// by the batch-organizing pass (see the organized-images deliverable) —
// e.g. "08__Back-Lumbar-Abdominal__Hernia-Belt__primary.jpeg". Only the
// product and type segments are used; the leading number and category are
// for the human's own ordering/reference, not matched against anything.
const AUTO_MATCH_PATTERN = /^\d+__[A-Za-z0-9-]+__([A-Za-z0-9-]+)__([a-z_]+)\.[a-z]+$/i;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Tries to read a product name + image type out of a filename produced by
 *  the naming convention above. Returns null (no auto-fill, unchanged
 *  manual-select behavior) for any filename that doesn't match — including
 *  a parsed type that isn't one of the site's real five, or a product
 *  segment with no confident single match in the real product list, so a
 *  bad or ambiguous guess never silently pre-fills the wrong product. */
function autoMatch(
  filename: string,
  products: BulkProductOption[],
): { productId: string; type: Row["type"] } | null {
  const m = AUTO_MATCH_PATTERN.exec(filename);
  if (!m) return null;
  const [, productSlug, type] = m;
  if (!VALID_TYPES.has(type)) return null;

  const target = normalize(productSlug.replace(/-/g, " "));
  const matches = products.filter((p) => normalize(p.name) === target);
  if (matches.length !== 1) return null; // no match, or ambiguous — leave manual

  return { productId: matches[0].id, type: type as Row["type"] };
}

// Phase 14 — bulk image upload. Raw camera/WhatsApp filenames don't
// reliably match product names, so this is manual-select by default. Where
// a file HAS been renamed to the "<seq>__<category>__<product>__<type>"
// convention (by a separate batch-organizing pass), autoMatch() above
// pre-fills the row and visibly marks it for a quick human confirmation
// rather than trusting it silently. A native <select> with a text filter
// above it stands in for a proper searchable combobox — the product list
// (77 items) doesn't justify a
// new dependency, and a plain <select> is still fully keyboard operable.
export function BulkImageUploader({ products }: { products: BulkProductOption[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<BulkUploadResult[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, filter]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next: Row[] = [];
    for (const file of Array.from(fileList)) {
      const auto = autoMatch(file.name, products);
      next.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        productId: auto?.productId ?? "",
        type: auto?.type ?? "primary",
        altText: "",
        autoMatched: auto !== null,
      });
    }
    setRows((prev) => [...prev, ...next]);
    setResults(null);
    setFormError(null);
  }

  function updateRow(key: string, patch: Partial<Row>) {
    // Editing product/type means the human overrode or confirmed-by-changing
    // the guess, so the "auto-matched, please glance to confirm" badge no
    // longer applies. Editing alt text alone doesn't affect match confidence.
    const clearsAutoMatch = "productId" in patch || "type" in patch;
    setRows((prev) =>
      prev.map((r) =>
        r.key === key ? { ...r, ...patch, autoMatched: clearsAutoMatch ? false : r.autoMatched } : r,
      ),
    );
  }

  function removeRow(key: string) {
    setRows((prev) => {
      const row = prev.find((r) => r.key === key);
      if (row) URL.revokeObjectURL(row.previewUrl);
      return prev.filter((r) => r.key !== key);
    });
  }

  async function handleSubmit() {
    setFormError(null);
    if (rows.length === 0) return;
    const unassigned = rows.filter((r) => !r.productId);
    if (unassigned.length > 0) {
      setFormError(
        `${unassigned.length} image${unassigned.length === 1 ? "" : "s"} still need${unassigned.length === 1 ? "s" : ""} a product selected before you can upload.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      for (const row of rows) {
        const product = products.find((p) => p.id === row.productId);
        formData.append("files", row.file);
        formData.append("productId", row.productId);
        formData.append("productName", product?.name ?? "");
        formData.append("type", row.type);
        formData.append("altText", row.altText);
      }
      const outcome = await bulkUploadImagesAction(formData);
      setResults(outcome);
      // Clear out only the rows that succeeded, so failed ones stay for retry.
      const failedKeys = new Set(
        rows.filter((_, i) => !outcome[i]?.ok).map((r) => r.key),
      );
      setRows((prev) => {
        for (const r of prev) {
          if (!failedKeys.has(r.key)) URL.revokeObjectURL(r.previewUrl);
        }
        return prev.filter((r) => failedKeys.has(r.key));
      });
    } catch {
      setFormError("Upload failed unexpectedly. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="card-surface flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          + Add images
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-small-muted">
          {rows.length === 0
            ? "JPEG, PNG or WebP, up to 8MB each."
            : (() => {
                const autoCount = rows.filter((r) => r.autoMatched).length;
                return autoCount === 0
                  ? `${rows.length} image${rows.length === 1 ? "" : "s"} ready to assign.`
                  : `${rows.length} image${rows.length === 1 ? "" : "s"} added — ${autoCount} auto-matched from the filename. Please glance through before uploading.`;
              })()}
        </p>
      </div>

      {results ? (
        <div className="mt-4 card-surface p-4">
          <p className="text-sm font-medium text-foreground">
            {results.filter((r) => r.ok).length} of {results.length} uploaded successfully.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {results.map((r, i) => (
              <li key={i} className={r.ok ? "text-muted" : "text-danger"}>
                {r.ok ? "✓" : "✕"} {r.fileName} → {r.productName}
                {r.error ? `: ${r.error}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {formError ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="mt-6">
          <label className="text-small-muted" htmlFor="bulk-product-filter">
            Filter product list (helps narrow the dropdowns below)
          </label>
          <input
            id="bulk-product-filter"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Type part of a product name…"
            className="mt-1 block w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />

          <ul className="mt-4 flex flex-col gap-4">
            {rows.map((row) => (
              <li key={row.key} className="card-surface flex flex-wrap items-start gap-4 p-4">
                <Image
                  src={row.previewUrl}
                  alt=""
                  width={96}
                  height={96}
                  unoptimized
                  className="h-24 w-24 shrink-0 rounded-md border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                    <span className="truncate">{row.file.name}</span>
                    {row.autoMatched ? (
                      <span className="shrink-0 rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-link">
                        Auto-matched — please confirm
                      </span>
                    ) : null}
                  </p>
                  <p className="text-small-muted">
                    {(row.file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                    <div>
                      <label className="text-small-muted" htmlFor={`product-${row.key}`}>
                        Product
                      </label>
                      <select
                        id={`product-${row.key}`}
                        value={row.productId}
                        onChange={(e) => updateRow(row.key, { productId: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        <option value="">— Select a product —</option>
                        {filteredProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.categoryName})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-small-muted" htmlFor={`type-${row.key}`}>
                        Type
                      </label>
                      <select
                        id={`type-${row.key}`}
                        value={row.type}
                        onChange={(e) =>
                          updateRow(row.key, { type: e.target.value as Row["type"] })
                        }
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        {IMAGE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-small-muted" htmlFor={`alt-${row.key}`}>
                      Alt text (optional)
                    </label>
                    <input
                      id={`alt-${row.key}`}
                      type="text"
                      value={row.altText}
                      onChange={(e) => updateRow(row.key, { altText: e.target.value })}
                      placeholder="Briefly describe the photo"
                      className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="text-small-muted shrink-0 rounded-sm hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
          >
            {submitting ? "Uploading…" : `Upload ${rows.length} image${rows.length === 1 ? "" : "s"}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
