/**
 * Phase 7 — create (or reset the password of) an admin user.
 *
 * Usage:
 *   npm run db:seed-admin -- --email=you@example.com --password=changeme
 *
 * Running it again with an existing email updates that admin's password
 * instead of erroring — handy for resetting a forgotten local password.
 */

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { getPool, closePool } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const [key, ...rest] = raw.slice(2).split("=");
    args[key] = rest.length ? rest.join("=") : true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = (args.email as string)?.trim().toLowerCase();
  const password = args.password as string;

  if (!email || !password) {
    console.error(
      "Usage: npm run db:seed-admin -- --email=you@example.com --password=changeme",
    );
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const pool = getPool();
  const client = await pool.connect();

  try {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM admin_users WHERE email = $1`,
      [email],
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE admin_users SET password_hash = $1, updated_at = now() WHERE email = $2`,
        [passwordHash, email],
      );
      console.log(`Updated password for existing admin "${email}".`);
      return;
    }

    await client.query(
      `INSERT INTO admin_users (id, email, password_hash, updated_at)
       VALUES ($1, $2, $3, now())`,
      [randomUUID(), email, passwordHash],
    );
    console.log(`Created admin "${email}".`);
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
