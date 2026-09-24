import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";

// Phase 7 — admin authentication primitives. Kept free of DB and
// next/headers imports on purpose so these can be unit tested directly
// (see auth.test.ts) without a Postgres connection or a request context.

const SALT_ROUNDS = 10;
export const SESSION_TTL_DAYS = 30;
export const SESSION_COOKIE_NAME = "admin_session";

/** Hash a plaintext password for storage. Never store the plaintext. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Compare a plaintext password against a stored bcrypt hash. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** A random session token — this is what goes in the browser cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * SHA-256 of the session token — this is what's stored in the database.
 * The raw token only ever lives in the httpOnly cookie and in memory at
 * login time, so a database read (or leak) alone can't be replayed as a
 * valid session.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiryDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isSessionExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() < now.getTime();
}
