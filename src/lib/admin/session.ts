import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS,
  generateSessionToken,
  hashSessionToken,
  isSessionExpired,
  sessionExpiryDate,
} from "@/lib/auth";

export interface AdminSessionInfo {
  adminUserId: string;
  email: string;
}

/** Create a session row + set the httpOnly cookie. Called right after a
 *  successful password check in the login server action. */
export async function createAdminSession(adminUserId: string): Promise<void> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = sessionExpiryDate();

  const pool = getPool();
  await pool.query(
    `INSERT INTO admin_sessions (id, admin_user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), adminUserId, tokenHash, expiresAt],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Read the session cookie and look it up. Returns null for a missing,
 *  unknown, or expired session — never throws, so callers can treat any
 *  null as "not logged in" without a try/catch. */
export async function getAdminSession(): Promise<AdminSessionInfo | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  try {
    const pool = getPool();
    const res = await pool.query<{
      admin_user_id: string;
      email: string;
      expires_at: string;
    }>(
      `SELECT s.admin_user_id, u.email, s.expires_at
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_user_id
       WHERE s.token_hash = $1`,
      [tokenHash],
    );
    const row = res.rows[0];
    if (!row) return null;
    if (isSessionExpired(new Date(row.expires_at))) return null;

    return { adminUserId: row.admin_user_id, email: row.email };
  } catch {
    // DB unreachable — treat as "not logged in" rather than crashing the
    // page; requireAdminSession() below will redirect to login as usual.
    return null;
  }
}

/** Use at the top of any protected admin layout/page. Redirects to the
 *  login page if there's no valid session. */
export async function requireAdminSession(): Promise<AdminSessionInfo> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/** Delete the session row (if any) and clear the cookie. Safe to call
 *  even if there's no active session. */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    try {
      const pool = getPool();
      await pool.query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [tokenHash]);
    } catch {
      // Best-effort — the cookie clear below is what actually logs the
      // browser out even if this DB delete fails.
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
