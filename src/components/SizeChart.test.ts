import { describe, expect, it } from "vitest";
import { isSizeChartData } from "./SizeChart";

describe("isSizeChartData", () => {
  it("accepts the real Lumbar Sacro Belt shape (size -> {in, cm})", () => {
    expect(
      isSizeChartData({
        S: { in: "28-32", cm: "71-81" },
        M: { in: "32-36", cm: "81-91" },
        L: { in: "36-40", cm: "91-102" },
        XL: { in: "40-44", cm: "102-112" },
      }),
    ).toBe(true);
  });

  it("accepts an entry with only `in`", () => {
    expect(isSizeChartData({ S: { in: "28-32" } })).toBe(true);
  });

  it("accepts an entry with only `cm`", () => {
    expect(isSizeChartData({ S: { cm: "71-81" } })).toBe(true);
  });

  it("rejects null", () => {
    expect(isSizeChartData(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isSizeChartData(undefined)).toBe(false);
  });

  it("rejects a plain string", () => {
    expect(isSizeChartData("S: 28-32in")).toBe(false);
  });

  it("rejects a number", () => {
    expect(isSizeChartData(42)).toBe(false);
  });

  it("rejects an array, even one that looks size-chart-shaped", () => {
    expect(isSizeChartData([{ in: "28-32", cm: "71-81" }])).toBe(false);
  });

  it("rejects an empty object", () => {
    expect(isSizeChartData({})).toBe(false);
  });

  it("rejects an entry that is itself an array", () => {
    expect(isSizeChartData({ S: ["28-32", "71-81"] })).toBe(false);
  });

  it("rejects an entry with neither in nor cm", () => {
    expect(isSizeChartData({ S: { note: "see manufacturer" } })).toBe(false);
  });

  it("rejects an entry whose in/cm aren't strings", () => {
    expect(isSizeChartData({ S: { in: 30, cm: 76 } })).toBe(false);
  });

  it("rejects when only some entries are well-formed", () => {
    expect(
      isSizeChartData({
        S: { in: "28-32", cm: "71-81" },
        M: { note: "unknown" },
      }),
    ).toBe(false);
  });

  it("rejects a null entry value", () => {
    expect(isSizeChartData({ S: null })).toBe(false);
  });

  // Phase 14 — weight-graded charts (kg), added alongside the original in/cm shape.
  it("accepts the weight-graded shape (size -> { kg })", () => {
    expect(
      isSizeChartData({
        Small: { kg: "25-45" },
        Medium: { kg: "45-65" },
        Large: { kg: "65-90" },
        "X-Large": { kg: "Above 90" },
      }),
    ).toBe(true);
  });

  it("rejects a kg value that isn't a string", () => {
    expect(isSizeChartData({ Small: { kg: 45 } })).toBe(false);
  });

  it("accepts a row with both in/cm and kg present", () => {
    expect(isSizeChartData({ S: { in: "28-32", cm: "71-81", kg: "45-65" } })).toBe(true);
  });
});
