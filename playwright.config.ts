import { defineConfig, devices } from "@playwright/test";

// Phase 13 §7 — a small, separate suite from Vitest (unit tests only).
// This runs against a real running server (dev, or a preview
// deployment) plus a real Postgres database, not an isolated
// component-level environment — see e2e/README.md for prerequisites
// (seeded admin user, at least one published product) and why it isn't
// wired into `npm test`.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
