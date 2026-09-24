"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/session";
import {
  reopenVerificationFlag,
  resolveVerificationFlag,
} from "@/lib/admin/verification-flags";

export async function resolveFlagAction(
  flagId: string,
  productId: string,
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim() || null;
  await resolveVerificationFlag(flagId, resolutionNote);

  redirect(`/admin/products/${productId}`);
}

export async function reopenFlagAction(
  flagId: string,
  productId: string,
): Promise<void> {
  await requireAdminSession();
  await reopenVerificationFlag(flagId);
  redirect(`/admin/products/${productId}`);
}
