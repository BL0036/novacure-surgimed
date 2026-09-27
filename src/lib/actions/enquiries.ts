"use server";

// Phase 11 — the one write an unauthenticated visitor can trigger. No
// admin session check (deliberately — this is a public form), no
// email/SMS notification (out of scope this phase, see README "Phase 11
// decisions"). Returns a state object rather than redirecting so the
// embedded form (product page / hospitals page) can show the success
// message inline without a page navigation.

import { createEnquiry } from "@/lib/enquiries";
import {
  isSpamSubmission,
  parseEnquiryQuantity,
  validateEnquiryFields,
} from "@/lib/enquiry-validation";

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
  // Phase 13 §2 — spam checks run first and, if tripped, return the
  // same "success" state a genuine submission gets (see
  // isSpamSubmission's doc comment) rather than any kind of error —
  // nothing here tells a bot which check it failed, or that it failed
  // one at all. Nothing is written to the database in that case.
  const honeypotValue = str(formData, "companyWebsite");
  const formRenderedAtRaw = formData.get("formRenderedAt");
  const parsedRenderedAt =
    typeof formRenderedAtRaw === "string" ? Number(formRenderedAtRaw) : NaN;
  const formRenderedAt = Number.isFinite(parsedRenderedAt) ? parsedRenderedAt : null;

  if (isSpamSubmission({ honeypotValue, formRenderedAt })) {
    return { status: "success" };
  }

  const customerName = str(formData, "customerName");
  const phone = str(formData, "phone");
  const addressOrArea = str(formData, "addressOrArea");
  const email = nullableStr(formData, "email");
  const organizationName = nullableStr(formData, "organizationName");
  const message = nullableStr(formData, "message");
  const quantity = parseEnquiryQuantity(str(formData, "quantity"));

  const fieldsValidation = validateEnquiryFields({
    customerName,
    phone,
    addressOrArea,
  });
  if (!fieldsValidation.valid) {
    return {
      status: "error",
      error: fieldsValidation.error,
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
