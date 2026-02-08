import { test as setup, expect } from "@playwright/test";

/**
 * Playwright Auth Setup — logs in as admin, saves storageState for reuse.
 *
 * Runs once before all E2E test projects that depend on "setup".
 * Credentials from scripts/db/import-seed-sql.ts (local Supabase seed).
 */

const ADMIN_EMAIL = "abel.mak@acr.com";
const ADMIN_PASSWORD = "acr2026admin";
const AUTH_FILE = "tests/e2e/.auth/admin.json";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");

  // Fill login form
  await page.getByLabel("Email Address").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);

  // Submit
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect to /admin (role-based redirect for admin users)
  await page.waitForURL("**/admin", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/admin/);

  // Save authenticated browser state
  await page.context().storageState({ path: AUTH_FILE });
});
