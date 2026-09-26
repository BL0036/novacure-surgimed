"use client";

import { useActionState } from "react";
import {
  createEnquiryAction,
  type EnquiryFormState,
} from "@/lib/actions/enquiries";
import { Label, Input, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const IDLE_STATE: EnquiryFormState = { status: "idle" };


interface EnquiryFormProps {
  /** Attaches the enquiry to a specific product/variant (product page).
   *  Omit both for a general enquiry (Hospitals & Pharmacies page). */
  productId?: string;
  variantId?: string;
  /** Phase 11 §3 — Hospitals & Pharmacies shows/labels organizationName
   *  for that context; the product-page form doesn't show this field at
   *  all (not in the Phase 11 §2b field list). */
  showOrganization?: boolean;
  organizationLabel?: string;
}

// Phase 11 §2b/§3 — one form, reused as-is on the product page (bound to
// a product/variant) and on /for-hospitals-pharmacies (bound to
// nothing). useActionState (not a redirecting <form action> like the
// admin forms) so the success confirmation renders in place instead of
// navigating away — this form can be embedded mid-page next to a price,
// where a redirect would be a jarring way to say "thanks".
export function EnquiryForm({
  productId,
  variantId,
  showOrganization = false,
  organizationLabel = "Organization name",
}: EnquiryFormProps) {
  const boundAction = createEnquiryAction.bind(
    null,
    productId ?? null,
    variantId ?? null,
  );
  const [state, formAction, pending] = useActionState(boundAction, IDLE_STATE);

  if (state.status === "success") {
    return (
      <p className="rounded-md border border-success bg-success-tint px-4 py-3 text-sm text-success">
        Thanks — we&rsquo;ll contact you shortly to confirm your order.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" && state.error ? (
        <p className="rounded-md border border-danger bg-danger-tint px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <div>
        <Label htmlFor="customerName">Name</Label>
        <Input id="customerName" name="customerName" required />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" required />
      </div>

      <div>
        <Label htmlFor="email">
          Email <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Input id="email" name="email" type="email" />
      </div>

      {showOrganization ? (
        <div>
          <Label htmlFor="organizationName">{organizationLabel}</Label>
          <Input id="organizationName" name="organizationName" />
        </div>
      ) : null}

      <div>
        <Label htmlFor="addressOrArea">Address / area</Label>
        <Input id="addressOrArea" name="addressOrArea" required />
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          step={1}
          defaultValue={1}
        />
      </div>

      <div>
        <Label htmlFor="message">
          Message <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Textarea id="message" name="message" />
      </div>

      <p className="text-small-muted">
        By submitting this form, you agree to be contacted by NovaCure SurgiMed
        regarding your enquiry.
      </p>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
