import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  isSessionExpired,
  sessionExpiryDate,
  verifyPassword,
} from "./auth";

describe("hashPassword / verifyPassword", () => {
  it("round-trips a correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(
      true,
    );
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("never stores the plaintext password in the hash", async () => {
    const password = "correct horse battery staple";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
  });
});

describe("generateSessionToken", () => {
  it("produces a 64-character hex string", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a different token on every call", () => {
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });
});

describe("hashSessionToken", () => {
  it("is deterministic for the same input", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashSessionToken(generateSessionToken())).not.toBe(
      hashSessionToken(generateSessionToken()),
    );
  });
});

describe("sessionExpiryDate / isSessionExpired", () => {
  it("sets an expiry SESSION_TTL_DAYS in the future", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const expiry = sessionExpiryDate(from);
    expect(expiry.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  it("treats a past date as expired", () => {
    expect(isSessionExpired(new Date("2020-01-01"), new Date("2026-01-01"))).toBe(true);
  });

  it("treats a future date as not expired", () => {
    expect(isSessionExpired(new Date("2030-01-01"), new Date("2026-01-01"))).toBe(
      false,
    );
  });
});
