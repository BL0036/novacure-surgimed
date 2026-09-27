-- Phase 13 §1 — admin login rate-limiting. Hand-written to match
-- prisma/schema.prisma, same reason as the Phase 1/7/9/11 migrations
-- (see README "About Prisma CLI"): the Prisma CLI can't reach
-- binaries.prisma.sh from this environment.

-- CreateTable
CREATE TABLE "admin_login_attempts" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Composite, not two single-column indexes: every query against this
-- table filters by identifier and attempted_at together (see
-- src/lib/admin/login-attempts.ts) and never by attempted_at alone.
CREATE INDEX "admin_login_attempts_identifier_attempted_at_idx" ON "admin_login_attempts"("identifier", "attempted_at");
