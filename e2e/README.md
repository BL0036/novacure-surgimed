# E2E smoke test (Phase 13 §7)

`enquiry-and-admin.spec.ts` covers the two flows requested:

1. Browse a category → open a product → submit the enquiry form → the
   enquiry appears in `/admin/enquiries`.
2. Admin login → edit a product → log out.

## Prerequisites

Unlike the Vitest suite (`npm test`), these tests hit a real running
server and a real Postgres database — they are **not** run as part of
`npm test` and are **not** wired into CI here. To run them:

1. `npm run dev` (or point `E2E_BASE_URL` at a deployed preview) with a
   database that has at least one published product with a variant, so
   there's something to browse/enquire about.
2. Seed an admin user if you haven't already:
   `npm run db:seed-admin -- --email=you@example.com --password=changeme`
3. Run:

   ```
   E2E_ADMIN_EMAIL=you@example.com \
   E2E_ADMIN_PASSWORD=changeme \
   npx playwright test
   ```

   Without `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` set, the admin-login
   test is skipped outright, and the enquiry test still runs but stops
   after confirming the on-page "Thanks — ..." success message (it
   can't check the admin enquiries list without a session).

## Known limitation: not executable in this sandbox

`@playwright/test` is installed (so the test file and config type-check
and lint cleanly), but Playwright's browser binaries are downloaded from
`playwright.azureedge.net`/`cdn.playwright.dev`, which are outside this
project's sandbox network egress allowlist — `npx playwright install`
cannot complete here, so this test has been written and reviewed but
**not actually run** in this environment. It needs to be run once in a
normal dev environment or CI (where `npx playwright install --with-deps
chromium` can reach those hosts) before it can be trusted the same way
the Vitest suite's green run can be.

## Notes on the product-edit test

It edits a product's short description, confirms the save persisted,
then reverts it to its original value in the same test run — so running
it against a real catalogue database doesn't leave any content changed,
consistent with this phase's "don't change product/content data"
instruction.
