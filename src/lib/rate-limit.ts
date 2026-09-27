// Phase 13 §1 — admin login rate-limiting. Deliberately free of DB and
// next/headers imports (same reasoning as auth.ts) so the actual lockout
// math can be unit tested directly (see rate-limit.test.ts) without a
// Postgres connection or a request context.

/** Failures within this trailing window count toward a lockout. */
export const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

/** Failures at or above this count, within the window, trigger a lockout. */
export const LOGIN_MAX_ATTEMPTS = 5;

/** How long a lockout lasts, measured from the most recent failure. */
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

export interface LoginLockoutStatus {
  locked: boolean;
  /** Seconds until the lockout clears. 0 when not locked. */
  retryAfterSeconds: number;
}

/**
 * Given the timestamps of recent failed login attempts for one
 * account/IP pair, decide whether that pair is currently locked out.
 *
 * A pair is locked once it has LOGIN_MAX_ATTEMPTS failures within
 * LOGIN_ATTEMPT_WINDOW_MS of "now", and stays locked for LOGIN_LOCKOUT_MS
 * measured from its most recent failure — so a failed attempt made while
 * already locked out extends the lockout, the same way most login
 * throttles behave (deliberate, not an oversight: it keeps a script that
 * keeps retrying locked out, rather than letting it "burn through" the
 * cooldown with more guesses).
 *
 * `failureTimestamps` does not need to be pre-filtered or sorted — this
 * function does both. Callers only need to know: are we locked right
 * now, and if so, how many seconds until we're not.
 */
export function checkLoginLockout(
  failureTimestamps: Date[],
  now: Date = new Date(),
): LoginLockoutStatus {
  const nowMs = now.getTime();
  const recentFailures = failureTimestamps
    .map((t) => t.getTime())
    .filter((t) => nowMs - t < LOGIN_ATTEMPT_WINDOW_MS && nowMs - t >= 0);

  if (recentFailures.length < LOGIN_MAX_ATTEMPTS) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  const mostRecentFailureMs = Math.max(...recentFailures);
  const elapsedSinceMostRecent = nowMs - mostRecentFailureMs;
  const remainingMs = LOGIN_LOCKOUT_MS - elapsedSinceMostRecent;

  if (remainingMs <= 0) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  return { locked: true, retryAfterSeconds: Math.ceil(remainingMs / 1000) };
}

/** Combines an email + client IP into one rate-limit identifier. Scoping
 *  to the pair (not just the email) means one IP hammering many made-up
 *  emails doesn't lock out a real admin's account from a different
 *  network, and one admin mistyping their own password from their usual
 *  IP doesn't lock out every other IP trying that same email. Lowercases
 *  the email since loginAction already normalizes it that way before
 *  the password check — kept consistent here so the same account+IP
 *  pair always hashes to the same identifier regardless of email casing. */
export function loginAttemptIdentifier(email: string, ip: string): string {
  return `${email.trim().toLowerCase()}|${ip}`;
}
