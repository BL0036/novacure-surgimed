"use server";

import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createAdminSession, destroyAdminSession } from "@/lib/admin/session";
import {
  checkLoginRateLimit,
  clearFailedLoginAttempts,
  getClientIp,
  recordFailedLoginAttempt,
} from "@/lib/admin/login-attempts";

// Phase 13 §1 — 5 failed attempts within 15 minutes locks out that
// email+IP pair for 15 minutes (see src/lib/rate-limit.ts for the exact
// math). Checked before the password verification, not after, so a
// locked-out attempt doesn't cost a bcrypt hash comparison for nothing.
export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=1");
  }

  const ip = await getClientIp();

  const lockout = await checkLoginRateLimit(email, ip);
  if (lockout.locked) {
    redirect(`/admin/login?error=locked&retryAfter=${lockout.retryAfterSeconds}`);
  }

  const pool = getPool();
  const res = await pool.query<{ id: string; password_hash: string }>(
    `SELECT id, password_hash FROM admin_users WHERE email = $1`,
    [email],
  );
  const admin = res.rows[0];

  // Same generic error either way — don't confirm/deny whether an email
  // is a registered admin.
  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    // Best-effort — recordFailedLoginAttempt never throws (see its doc
    // comment), so this can't turn one bad password into an unrelated
    // server error for the person typing it.
    await recordFailedLoginAttempt(email, ip);
    redirect("/admin/login?error=1");
  }

  await clearFailedLoginAttempts(email, ip);
  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
