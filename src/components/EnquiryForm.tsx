"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { createEnquiryAction, type EnquiryFormState } from "@/lib/actions/enquiries";
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
  /** Phase 13 §2 — ms-since-epoch this form was rendered, for the
   *  minimum-time-to-submit spam check. Pass this from a Server
   *  Component ancestor for a form that's part of the page's initial
   *  render (e.g. /for-hospitals-pharmacies) — computed server-side and
   *  threaded through as a plain prop value, it comes out identical on
   *  the server-rendered HTML and the client hydration pass, and (since
   *  it's baked into the HTML rather than set by client JS after the
   *  fact) it's there even for the no-JS progressive-enhancement submit
   *  path this form already supports. Omit it for a form that only ever
   *  mounts client-side after an interaction (e.g. VariantSelector's
   *  "Request this product" toggle) — those fall back to the moment
   *  they actually mounted in the browser, which is the more accurate
   *  "rendered at" for that case anyway. */
  renderedAt?: number;
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
  renderedAt,
}: EnquiryFormProps) {
  const boundAction = createEnquiryAction.bind(
    null,
    productId ?? null,
    variantId ?? null,
  );
  const [state, formAction, pending] = useActionState(boundAction, IDLE_STATE);
  // Lazy initializer so this only ever evaluates once — see the
  // renderedAt prop doc comment above for why a caller-supplied value
  // (server render time) takes priority over the client mount time.
  const [mountedAt, setMountedAt] = useState(() => renderedAt ?? Date.now());
  // Re-anchor to the browser's own clock once mounted. This matters for
  // a form that's part of an ISR/cached page's initial HTML (e.g.
  // /for-hospitals-pharmacies, revalidate = 3600): the server-supplied
  // `renderedAt` was frozen at that page's last (re)generation, which
  // could be up to an hour stale by the time a real visitor loads it —
  // and a stale timestamp only ever makes the elapsed-time check look
  // like *more* time has passed, which would let a bot that fetches the
  // cached page and posts immediately sail through undetected. A
  // client-side visitor's actual mount time fixes that. A no-JS
  // submission never runs this effect and keeps using the server value
  // as-is — since that only ever biases toward "more time elapsed," it
  // never blocks a genuine no-JS visitor, so this is a security
  // improvement for JS-enabled visitors rather than something the form
  // depends on to function correctly.
  // Phase 13 §2: intentional one-time hydration correction, not a sync
  // loop. Empty deps array means this fires exactly once per mount,
  // purely to re-anchor `mountedAt` from the server's (possibly
  // ISR-stale) render time to the browser's real clock — see the doc
  // comment above for why that matters. There's no external system to
  // subscribe to here; the "external system" being synced is just
  // "what time is it right now in this browser," which by definition
  // can only be read after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMountedAt(Date.now());
  }, []);

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

      {/* Phase 13 §2 — spam protection, not real fields. Both are
          validated in createEnquiryAction (src/lib/actions/enquiries.ts),
          which rejects silently (no visible error) rather than telling a
          bot which check it tripped. */}
      <input type="hidden" name="formRenderedAt" value={mountedAt} />
      {/* Honeypot: real visitors never see or fill this in (visually
          hidden off-canvas, not display:none — some bots specifically
          skip display:none/visibility:hidden fields, so this style is
          deliberate) and it's out of the tab order and hidden from
          screen readers, so a keyboard/AT user can't stumble into it
          either. Named to look like a plausible field a scripted bot
          would fill in along with the rest of the form. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        <label htmlFor="companyWebsite">Company website</label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

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
