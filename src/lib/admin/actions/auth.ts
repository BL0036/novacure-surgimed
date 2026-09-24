"use server";

import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createAdminSession, destroyAdminSession } from "@/lib/admin/session";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=1");
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
    redirect("/admin/login?error=1");
  }

  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
