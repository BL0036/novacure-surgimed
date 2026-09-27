import { describe, expect, it } from "vitest";
import { formatPrice, resolveVariantRefCode } from "./format";

describe("formatPrice", () => {
  it("formats a decimal-string price as NPR", () => {
    expect(formatPrice("1500")).toBe("Rs. 1,500");
  });

  it("shows 'Price on request' for null", () => {
    expect(formatPrice(null)).toBe("Price on request");
  });

  it("shows 'Price on request' for a non-numeric string", () => {
    expect(formatPrice("not-a-number")).toBe("Price on request");
  });

  it("formats zero as Rs. 0, not as unpriced", () => {
    expect(formatPrice("0")).toBe("Rs. 0");
  });
});

describe("resolveVariantRefCode", () => {
  it("prefers the variant's own ref code when set", () => {
    expect(resolveVariantRefCode("VAR-1", "PROD-1")).toBe("VAR-1");
  });

  it("falls back to the product's ref code when the variant has none", () => {
    expect(resolveVariantRefCode(null, "PROD-1")).toBe("PROD-1");
  });

  it("returns null when neither is set", () => {
    expect(resolveVariantRefCode(null, null)).toBe(null);
  });
});
