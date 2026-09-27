// Phase 13 §2/§6 — pure enquiry validation, kept free of FormData and
// server-action imports on purpose so it can be unit tested directly
// (see enquiry-validation.test.ts) the same way rate-limit.ts is.

export interface EnquiryFieldsInput {
  customerName: string;
  phone: string;
  addressOrArea: string;
}

export interface EnquiryFieldsValidation {
  valid: boolean;
  error?: string;
}

/** The same three-required-field rule createEnquiryAction has always
 *  enforced (Phase 11) — extracted as-is, not changed, so it can be
 *  tested directly. */
export function validateEnquiryFields(
  input: EnquiryFieldsInput,
): EnquiryFieldsValidation {
  if (!input.customerName || !input.phone || !input.addressOrArea) {
    return {
      valid: false,
      error: "Name, phone, and address/area are required.",
    };
  }
  return { valid: true };
}

/** Same quantity-parsing rule createEnquiryAction has always used
 *  (Phase 11) — extracted as-is. Falls back to 1 for anything that
 *  isn't a positive integer. */
export function parseEnquiryQuantity(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Minimum time, in ms, that must elapse between the form rendering and
 *  the submission reaching the server. Real visitors take at least a
 *  few seconds to read the form and type a name/phone/address; a bot
 *  that fills and submits a scraped form programmatically routinely
 *  does it in well under a second. */
export const MIN_SUBMIT_TIME_MS = 2000;

export interface SpamCheckInput {
  /** Raw value of the honeypot field. Any non-empty value means
   *  something filled in a field real visitors never see — a bot. */
  honeypotValue: string;
  /** ms-since-epoch the form was rendered (see EnquiryForm's
   *  `renderedAt` prop), or null if it was missing/unparseable. */
  formRenderedAt: number | null;
  /** ms-since-epoch "now". Defaults to Date.now() — overridable for
   *  tests. */
  now?: number;
}

/**
 * True if this submission looks like a bot, by either signal:
 *  - the honeypot field was filled in (real visitors can't see it), or
 *  - the form was submitted less than MIN_SUBMIT_TIME_MS after it
 *    rendered.
 *
 * A missing/unparseable formRenderedAt does NOT count as spam on its
 * own — failing open here (falling back to the honeypot as the only
 * signal) means a dropped/mangled hidden field from something outside
 * our control (an overzealous proxy, a browser extension) can't lock a
 * real visitor out of submitting a genuine enquiry. The honeypot check
 * doesn't have this problem (an empty value is unambiguous), so it's
 * always enforced.
 */
export function isSpamSubmission({
  honeypotValue,
  formRenderedAt,
  now = Date.now(),
}: SpamCheckInput): boolean {
  if (honeypotValue.trim() !== "") return true;
  if (formRenderedAt === null || !Number.isFinite(formRenderedAt)) return false;
  const elapsed = now - formRenderedAt;
  // A negative elapsed time (clock skew, or a forged future timestamp)
  // is nonsensical either way — not confidently "too fast", so it isn't
  // flagged by the timing check alone.
  if (elapsed < 0) return false;
  return elapsed < MIN_SUBMIT_TIME_MS;
}
