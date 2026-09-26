"use server";

// Phase 11 — the one write an unauthenticated visitor can trigger. No
// admin session check (deliberately — this is a public form), no
// email/SMS notification (out of scope this phase, see README "Phase 11
// decisions"). Returns a state object rather than redirecting so the
// embedded form (product page / hospitals page) can show the success
// message inline without a page navigation.

import { createEnquiry } from "@/lib/enquiries";

export interface EnquiryFormState {
  status: "idle" | "success" | "error";
  error?: string;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullableStr(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value ? value : null;
}

export async function createEnquiryAction(
  productId: string | null,
  variantId: string | null,
  _prevState: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  const customerName = str(formData, "customerName");
  const phone = str(formData, "phone");
  const addressOrArea = str(formData, "addressOrArea");
  const email = nullableStr(formData, "email");
  const organizationName = nullableStr(formData, "organizationName");
  const message = nullableStr(formData, "message");

  const parsedQuantity = Number.parseInt(str(formData, "quantity"), 10);
  const quantity =
    Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

  if (!customerName || !phone || !addressOrArea) {
    return {
      status: "error",
      error: "Name, phone, and address/area are required.",
    };
  }

  try {
    await createEnquiry({
      productId,
      variantId,
      customerName,
      phone,
      email,
      organizationName,
      addressOrArea,
      quantity,
      message,
    });
  } catch {
    return {
      status: "error",
      error:
        "Something went wrong submitting your enquiry — please try again, or reach us on WhatsApp instead.",
    };
  }

  return { status: "success" };
}
