import { test, expect, type Page } from "@playwright/test";

// Phase 13 §7 — end-to-end smoke test against a real running server +
// database (see e2e/README.md for prerequisites). This intentionally
// discovers real seeded content (first category, first product, first
// admin-editable product) rather than hardcoding product names/slugs,
// so it isn't coupled to this catalogue's specific data and keeps
// working as the catalogue changes.

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

// A real visitor takes more than a couple of seconds to read a product
// page and fill in the enquiry form; our own min-submit-time spam check
// (Phase 13 §2, MIN_SUBMIT_TIME_MS in src/lib/enquiry-validation.ts)
// would otherwise treat this test's fast, scripted submission as spam
// and silently no-op it — which would make the "appears in admin"
// assertion below fail for the wrong reason. This wait is what makes a
// real visitor's pace, not a workaround for a bug.
const ENQUIRY_FORM_SETTLE_MS = 2_500;

test.describe("public storefront: browse -> product -> enquiry", () => {
  test("submitting an enquiry from a product page reaches the admin enquiries list", async ({
    page,
  }) => {
    const customerName = `E2E Test ${Date.now()}`;

    await page.goto("/shop");

    // First real category link on the shop/category index — not a
    // specific hardcoded slug.
    const categoryLink = page
      .getByRole("main")
      .getByRole("link")
      .filter({ hasText: /.+/ })
      .first();
    await categoryLink.click();

    // First product card link on the resulting category page.
    const productLink = page
      .getByRole("main")
      .getByRole("link")
      .filter({ hasText: /.+/ })
      .first();
    const productName = (await productLink.textContent())?.trim();
    await productLink.click();

    // "Request this product" reveals the enquiry form (see
    // VariantSelector.tsx) — WhatsApp's CTA opens a new tab and isn't
    // part of this flow.
    await page.getByRole("button", { name: "Request this product" }).click();

    await page.getByLabel("Name").fill(customerName);
    await page.getByLabel("Phone").fill("9800000000");
    await page.getByLabel("Address / area").fill("Ramechhap");

    // See ENQUIRY_FORM_SETTLE_MS's doc comment above.
    await page.waitForTimeout(ENQUIRY_FORM_SETTLE_MS);

    await page.getByRole("button", { name: "Submit request" }).click();

    await expect(
      page.getByText("Thanks — we'll contact you shortly to confirm your order."),
    ).toBeVisible();

    // Now confirm it actually landed in the admin enquiries list — the
    // real point of this test (the spam checks make it easy to submit
    // a form that *looks* like it succeeded but wrote nothing).
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      "Set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD to verify the enquiry reached admin.",
    );
    await loginAsAdmin(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/admin/enquiries");
    await expect(page.getByRole("cell", { name: customerName })).toBeVisible();
    if (productName) {
      await expect(
        page.getByRole("row", { name: new RegExp(customerName) }),
      ).toContainText(productName);
    }
  });
});

test.describe("admin: login -> edit a product -> logout", () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD (see e2e/README.md) to run this test.",
  );

  test("logs in, edits a product's short description, then logs out", async ({
    page,
  }) => {
    await loginAsAdmin(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    await page.goto("/admin/products");
    await page.locator("table tbody tr").first().getByRole("link").first().click();
    await expect(page).toHaveURL(/\/admin\/products\/[^/]+$/);

    const descriptionField = page.getByLabel("Short description");
    const original = (await descriptionField.inputValue()) ?? "";
    const marker = ` [e2e ${Date.now()}]`;

    // Edit, save, verify it persisted...
    await descriptionField.fill(original + marker);
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page).toHaveURL(/\/admin\/products\/[^/]+$/);
    await expect(page.getByLabel("Short description")).toHaveValue(original + marker);

    // ...then revert it, so this smoke test never leaves real catalogue
    // content changed (see Phase 13 instructions: don't change product
    // data). This is the same "edit a product" action exercised twice,
    // which still fully covers the flow the smoke test is meant to check.
    await page.getByLabel("Short description").fill(original);
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page.getByLabel("Short description")).toHaveValue(original);

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

async function loginAsAdmin(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/admin");
}
