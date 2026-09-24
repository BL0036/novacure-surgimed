"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/session";
import {
  createProduct,
  createVariant,
  getDefaultBrandId,
  updateProduct,
  updateVariant,
  type ProductStatus,
  type PublicationStatus,
  type StockStatus,
  type VatStatus,
} from "@/lib/admin/products";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullableStr(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value ? value : null;
}

export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  await updateProduct(id, {
    name: str(formData, "name"),
    categoryId: str(formData, "categoryId"),
    manufacturerRefCode: nullableStr(formData, "manufacturerRefCode"),
    shortDescription: nullableStr(formData, "shortDescription"),
    fullDescription: nullableStr(formData, "fullDescription"),
    features: nullableStr(formData, "features"),
    status: str(formData, "status") as ProductStatus,
    publicationStatus: str(formData, "publicationStatus") as PublicationStatus,
  });

  redirect(`/admin/products/${id}`);
}

export async function createProductAction(formData: FormData): Promise<void> {
  await requireAdminSession();

  const brandId = await getDefaultBrandId();
  if (!brandId) {
    // No Brand row exists yet (e.g. fresh DB, nothing imported/seeded).
    // Nothing sensible to attach the product to — send the admin back
    // with an explanation rather than a raw 500.
    redirect("/admin/products/new?error=no-brand");
  }

  const id = await createProduct({
    brandId,
    categoryId: str(formData, "categoryId"),
    name: str(formData, "name"),
    manufacturerRefCode: nullableStr(formData, "manufacturerRefCode"),
    shortDescription: nullableStr(formData, "shortDescription"),
  });

  redirect(`/admin/products/${id}`);
}

export async function updateVariantAction(
  productId: string,
  variantId: string,
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  await updateVariant(variantId, {
    sizeLabel: str(formData, "sizeLabel"),
    stockistRate: nullableStr(formData, "stockistRate"),
    retailPrice: nullableStr(formData, "retailPrice"),
    mrp: str(formData, "mrp"),
    stockStatus: str(formData, "stockStatus") as StockStatus,
  });

  redirect(`/admin/products/${productId}`);
}

export async function createVariantAction(
  productId: string,
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  const error = await createVariant({
    productId,
    sizeLabel: str(formData, "sizeLabel"),
    sku: str(formData, "sku"),
    uom: str(formData, "uom"),
    mrp: str(formData, "mrp"),
    vatStatus: str(formData, "vatStatus") as VatStatus,
  });

  if (error) {
    redirect(`/admin/products/${productId}?variantError=${encodeURIComponent(error)}`);
  }

  redirect(`/admin/products/${productId}`);
}
