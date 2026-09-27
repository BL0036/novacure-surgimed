import { describe, expect, it } from "vitest";
import {
  isSpamSubmission,
  MIN_SUBMIT_TIME_MS,
  parseEnquiryQuantity,
  validateEnquiryFields,
} from "./enquiry-validation";

describe("validateEnquiryFields", () => {
  it("accepts when all three required fields are present", () => {
    expect(
      validateEnquiryFields({
        customerName: "Ram Bahadur",
        phone: "9800000000",
        addressOrArea: "Ramechhap",
      }),
    ).toEqual({ valid: true });
  });

  it("rejects when customerName is missing", () => {
    const result = validateEnquiryFields({
      customerName: "",
      phone: "9800000000",
      addressOrArea: "Ramechhap",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it("rejects when phone is missing", () => {
    expect(
      validateEnquiryFields({
        customerName: "Ram",
        phone: "",
        addressOrArea: "Ramechhap",
      }).valid,
    ).toBe(false);
  });

  it("rejects when addressOrArea is missing", () => {
    expect(
      validateEnquiryFields({
        customerName: "Ram",
        phone: "9800000000",
        addressOrArea: "",
      }).valid,
    ).toBe(false);
  });

  it("rejects when every field is missing", () => {
    expect(
      validateEnquiryFields({ customerName: "", phone: "", addressOrArea: "" }).valid,
    ).toBe(false);
  });
});

describe("parseEnquiryQuantity", () => {
  it("parses a positive integer string", () => {
    expect(parseEnquiryQuantity("5")).toBe(5);
  });

  it("falls back to 1 for an empty string", () => {
    expect(parseEnquiryQuantity("")).toBe(1);
  });

  it("falls back to 1 for zero", () => {
    expect(parseEnquiryQuantity("0")).toBe(1);
  });

  it("falls back to 1 for a negative number", () => {
    expect(parseEnquiryQuantity("-3")).toBe(1);
  });

  it("falls back to 1 for non-numeric input", () => {
    expect(parseEnquiryQuantity("abc")).toBe(1);
  });

  it("truncates a decimal to an integer", () => {
    expect(parseEnquiryQuantity("3.7")).toBe(3);
  });
});

describe("isSpamSubmission", () => {
  const RENDERED_AT = 1_000_000;

  it("is not spam for a normal submission well after MIN_SUBMIT_TIME_MS", () => {
    expect(
      isSpamSubmission({
        honeypotValue: "",
        formRenderedAt: RENDERED_AT,
        now: RENDERED_AT + 10_000,
      }),
    ).toBe(false);
  });

  it("is spam when the honeypot field is filled in", () => {
    expect(
      isSpamSubmission({
        honeypotValue: "http://spam.example.com",
        formRenderedAt: RENDERED_AT,
        now: RENDERED_AT + 10_000,
      }),
    ).toBe(true);
  });

  it("treats a honeypot value of only whitespace as filled in", () => {
    expect(
      isSpamSubmission({
        honeypotValue: "   ",
        formRenderedAt: RENDERED_AT,
        now: RENDERED_AT + 10_000,
      }),
    ).toBe(false); // whitespace-only trims to empty — matches a real empty honeypot
  });

  it("is spam when submitted faster than MIN_SUBMIT_TIME_MS", () => {
    expect(
      isSpamSubmission({
        honeypotValue: "",
        formRenderedAt: RENDERED_AT,
        now: RENDERED_AT + MIN_SUBMIT_TIME_MS - 1,
      }),
    ).toBe(true);
  });

  it("is not spam right at the MIN_SUBMIT_TIME_MS boundary", () => {
    expect(
      isSpamSubmission({
        honeypotValue: "",
        formRenderedAt: RENDERED_AT,
        now: RENDERED_AT + MIN_SUBMIT_TIME_MS,
      }),
    ).toBe(false);
  });

  it("does not flag a missing formRenderedAt as spam on its own", () => {
    expect(
      isSpamSubmission({
        honeypotValue: "",
        formRenderedAt: null,
        now: RENDERED_AT,
      }),
    ).toBe(false);
  });

  it("still catches the honeypot even with a missing formRenderedAt", () => {
    expect(
      isSpamSubmission({
        honeypotValue: "filled",
        formRenderedAt: null,
        now: RENDERED_AT,
      }),
    ).toBe(true);
  });

  it("does not flag a negative elapsed time (clock skew) as spam", () => {
    expect(
      isSpamSubmission({
        honeypotValue: "",
        formRenderedAt: RENDERED_AT,
        now: RENDERED_AT - 5000,
      }),
    ).toBe(false);
  });
});
