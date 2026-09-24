"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/session";
import {
  deleteProductImage,
  saveProductImage,
  type ProductImageType,
} from "@/lib/admin/images";

export async function uploadImageAction(
  productId: string,
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  const file = formData.get("file");
  const type = String(formData.get("type") ?? "primary") as ProductImageType;
  const altText = String(formData.get("altText") ?? "").trim() || null;

  if (!(file instanceof File)) {
    redirect(
      `/admin/products/${productId}?imageError=${encodeURIComponent("No file was selected.")}`,
    );
  }

  const error = await saveProductImage(productId, file, type, altText);
  if (error) {
    redirect(`/admin/products/${productId}?imageError=${encodeURIComponent(error)}`);
  }

  redirect(`/admin/products/${productId}`);
}

export async function deleteImageAction(
  imageId: string,
  productId: string,
): Promise<void> {
  await requireAdminSession();
  await deleteProductImage(imageId);
  redirect(`/admin/products/${productId}`);
}
