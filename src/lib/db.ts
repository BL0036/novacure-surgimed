import { Pool } from "pg";

// NOTE: This project's data model is defined in prisma/schema.prisma and is
// the source of truth. Scripts talk to Postgres through this small `pg`
// pool instead of a generated @prisma/client for now — see README.md
// ("Why raw pg instead of @prisma/client") for the reason and how to
// switch once `npx prisma generate` can run in your environment.
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set (check your .env file).");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
