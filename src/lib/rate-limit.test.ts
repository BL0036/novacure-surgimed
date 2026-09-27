import { describe, expect, it } from "vitest";
import {
  checkLoginLockout,
  loginAttemptIdentifier,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_ATTEMPT_WINDOW_MS,
  LOGIN_LOCKOUT_MS,
} from "./rate-limit";

const NOW = new Date("2026-09-26T12:00:00.000Z");

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60 * 1000);
}

describe("checkLoginLockout", () => {
  it("is not locked with no failures", () => {
    expect(checkLoginLockout([], NOW)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
    });
  });

  it("is not locked with fewer than the max failures in the window", () => {
    const failures = [minutesAgo(1), minutesAgo(2), minutesAgo(3), minutesAgo(4)];
    expect(failures.length).toBeLessThan(LOGIN_MAX_ATTEMPTS);
    expect(checkLoginLockout(failures, NOW).locked).toBe(false);
  });

  it("locks out once the max failures occur within the window", () => {
    const failures = [
      minutesAgo(1),
      minutesAgo(2),
      minutesAgo(3),
      minutesAgo(4),
      minutesAgo(5),
    ];
    expect(failures.length).toBe(LOGIN_MAX_ATTEMPTS);
    const status = checkLoginLockout(failures, NOW);
    expect(status.locked).toBe(true);
    // Most recent failure was 1 minute ago; lockout is 15 minutes from
    // that failure, so ~14 minutes (840s) should remain.
    expect(status.retryAfterSeconds).toBeGreaterThan(800);
    expect(status.retryAfterSeconds).toBeLessThanOrEqual(840);
  });

  it("ignores failures older than the attempt window", () => {
    const windowMinutes = LOGIN_ATTEMPT_WINDOW_MS / 60_000;
    const failures = [
      minutesAgo(windowMinutes + 1),
      minutesAgo(windowMinutes + 2),
      minutesAgo(windowMinutes + 3),
      minutesAgo(windowMinutes + 4),
      minutesAgo(windowMinutes + 5),
    ];
    expect(checkLoginLockout(failures, NOW).locked).toBe(false);
  });

  it("clears once the lockout duration has elapsed since the last failure", () => {
    const lockoutMinutes = LOGIN_LOCKOUT_MS / 60_000;
    // 5 failures clustered together, but all now further in the past
    // than the lockout duration — should no longer be locked.
    const base = lockoutMinutes + 1;
    const failures = [0, 1, 2, 3, 4].map((offset) => minutesAgo(base + offset));
    expect(checkLoginLockout(failures, NOW).locked).toBe(false);
  });

  it("a failure made while locked out extends the lockout (documented behavior)", () => {
    const failures = [
      minutesAgo(0.5),
      minutesAgo(1),
      minutesAgo(2),
      minutesAgo(3),
      minutesAgo(4),
      minutesAgo(5),
    ];
    const status = checkLoginLockout(failures, NOW);
    expect(status.locked).toBe(true);
    // Anchored to the most recent (0.5 min ago) failure, not the 5th.
    expect(status.retryAfterSeconds).toBeGreaterThanOrEqual(870);
  });

  it("treats exactly LOGIN_MAX_ATTEMPTS-1 failures as not locked (boundary)", () => {
    const failures = Array.from({ length: LOGIN_MAX_ATTEMPTS - 1 }, (_, i) =>
      minutesAgo(i + 1),
    );
    expect(checkLoginLockout(failures, NOW).locked).toBe(false);
  });

  it("ignores a timestamp in the future (defensive, shouldn't normally happen)", () => {
    const failures = [
      new Date(NOW.getTime() + 60_000),
      minutesAgo(1),
      minutesAgo(2),
      minutesAgo(3),
    ];
    expect(checkLoginLockout(failures, NOW).locked).toBe(false);
  });
});

describe("loginAttemptIdentifier", () => {
  it("combines email and ip with a separator", () => {
    expect(loginAttemptIdentifier("admin@example.com", "1.2.3.4")).toBe(
      "admin@example.com|1.2.3.4",
    );
  });

  it("normalizes email casing and whitespace so the same account matches", () => {
    expect(loginAttemptIdentifier("  Admin@Example.com ", "1.2.3.4")).toBe(
      loginAttemptIdentifier("admin@example.com", "1.2.3.4"),
    );
  });

  it("keeps different IPs for the same email as distinct identifiers", () => {
    expect(loginAttemptIdentifier("admin@example.com", "1.2.3.4")).not.toBe(
      loginAttemptIdentifier("admin@example.com", "5.6.7.8"),
    );
  });
});
