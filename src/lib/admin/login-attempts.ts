import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { getPool } from "@/lib/db";
import {
  checkLoginLockout,
  loginAttemptIdentifier,
  type LoginLockoutStatus,
} from "@/lib/rate-limit";

// Phase 13 §1 — persisted in Postgres (admin_login_attempts table, see
// prisma/migrations/.../phase13_security), not an in-memory Map. This
// project already runs one server process against a shared Postgres
// database (see README "Why raw pg instead of @prisma/client"), and an
// in-memory store would reset on every deploy/restart and wouldn't be
// shared across multiple instances if this is ever scaled horizontally —
// a real gap for something whose entire job is remembering recent
// failures. A DB table costs one extra query per login attempt, which is
// negligible next to bcrypt's own cost.

/** Best-effort client IP from standard proxy headers. Vercel (and most
 *  reverse proxies) set x-forwarded-for as "client, proxy1, proxy2" —
 *  the first entry is the original client. Falls back to a fixed string
 *  (never null/undefined) so a missing header degrades to "everyone
 *  behind this identifier shares a lockout bucket" rather than throwing
 *  or silently skipping rate-limiting altogether. */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerList.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/** Recent failed attempts for this email+IP pair, for the lockout check. */
async function getRecentFailureTimestamps(identifier: string): Promise<Date[]> {
  const pool = getPool();
  const res = await pool.query<{ attempted_at: string }>(
    `SELECT attempted_at FROM admin_login_attempts
     WHERE identifier = $1
       AND attempted_at > now() - interval '15 minutes'`,
    [identifier],
  );
  return res.rows.map((r) => new Date(r.attempted_at));
}

/** Checks whether this email+IP pair is currently locked out. Never
 *  throws — a DB error is treated as "not locked" (fail open) so a
 *  transient database issue degrades to "no rate limiting" rather than
 *  locking every admin out of their own dashboard. */
export async function checkLoginRateLimit(
  email: string,
  ip: string,
): Promise<LoginLockoutStatus> {
  try {
    const identifier = loginAttemptIdentifier(email, ip);
    const failures = await getRecentFailureTimestamps(identifier);
    return checkLoginLockout(failures);
  } catch {
    return { locked: false, retryAfterSeconds: 0 };
  }
}

/** Records one failed login attempt. Best-effort — a failure to record
 *  (DB down) shouldn't itself crash the login flow; it just means this
 *  one attempt doesn't count toward a future lockout. Opportunistically
 *  clears attempts older than the window on the same call so the table
 *  doesn't grow unbounded without needing a separate cron/cleanup job. */
export async function recordFailedLoginAttempt(
  email: string,
  ip: string,
): Promise<void> {
  const identifier = loginAttemptIdentifier(email, ip);
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO admin_login_attempts (id, identifier, attempted_at)
       VALUES ($1, $2, now())`,
      [randomUUID(), identifier],
    );
    // Best-effort housekeeping — failures well outside any lockout
    // window are never read again, so there's no reason to keep them.
    await pool.query(
      `DELETE FROM admin_login_attempts WHERE attempted_at < now() - interval '1 day'`,
    );
  } catch {
    // See doc comment — intentionally swallowed.
  }
}

/** Clears recorded failures for this email+IP pair after a successful
 *  login, so a legitimate login isn't one step away from a lockout the
 *  next time this admin mistypes their password. Best-effort, same
 *  reasoning as recordFailedLoginAttempt. */
export async function clearFailedLoginAttempts(
  email: string,
  ip: string,
): Promise<void> {
  const identifier = loginAttemptIdentifier(email, ip);
  const pool = getPool();
  try {
    await pool.query(`DELETE FROM admin_login_attempts WHERE identifier = $1`, [
      identifier,
    ]);
  } catch {
    // Best-effort — see doc comment above.
  }
}
