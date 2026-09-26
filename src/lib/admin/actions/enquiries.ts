"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/session";
import { updateEnquiryStatus, type EnquiryStatus } from "@/lib/admin/enquiries";

const VALID_STATUSES: EnquiryStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "fulfilled",
  "cancelled",
];

export async function updateEnquiryStatusAction(
  enquiryId: string,
  formData: FormData,
): Promise<void> {
  await requireAdminSession();

  const status = String(formData.get("status") ?? "");
  if (VALID_STATUSES.includes(status as EnquiryStatus)) {
    await updateEnquiryStatus(enquiryId, status as EnquiryStatus);
  }

  redirect(`/admin/enquiries/${enquiryId}`);
}
