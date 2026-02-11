import { test, expect } from "@playwright/test";

/**
 * Auth Boundary Tests — verifies middleware RBAC logic.
 *
 * Runs in the "auth-tests" Playwright project (no storageState).
 * Tests unauthenticated access, role restrictions, and login/logout flows.
 *
 * Middleware logic: src/middleware.ts
 * Seed users: scripts/db/import-seed-sql.ts
 */

const DATA_MANAGER_EMAIL = "carlos.data@acr.com";
const DATA_MANAGER_PASSWORD = "acr2026data";

test.describe("Auth Boundaries", () => {
  test("unauthenticated user accessing /admin is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("redirect=%2Fadmin");
  });

  test("unauthenticated user accessing /data-portal is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/data-portal");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("redirect=%2Fdata-portal");
  });

  test("unauthenticated user can access homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("unauthenticated user can access /parts (public search)", async ({
    page,
  }) => {
    await page.goto("/parts");
    // Should stay on /parts, not redirect
    await expect(page).toHaveURL(/\/parts/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email Address").fill("nobody@acr.com");
    await page.getByLabel("Password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show error message
    await expect(page.getByText("Authentication Failed")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("data_manager login redirects to /data-portal", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email Address").fill(DATA_MANAGER_EMAIL);
    await page.getByLabel("Password").fill(DATA_MANAGER_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/data-portal", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/data-portal/);
  });

  test("data_manager accessing /admin is redirected to /data-portal", async ({
    page,
  }) => {
    // First log in as data_manager
    await page.goto("/login");
    await page.getByLabel("Email Address").fill(DATA_MANAGER_EMAIL);
    await page.getByLabel("Password").fill(DATA_MANAGER_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/data-portal", { timeout: 15_000 });

    // Now try to access /admin — should be redirected back
    await page.goto("/admin");
    await page.waitForURL("**/data-portal", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/data-portal/);
  });

  test("logout clears session and redirects to homepage", async ({ page }) => {
    // Log in as data_manager first
    await page.goto("/login");
    await page.getByLabel("Email Address").fill(DATA_MANAGER_EMAIL);
    await page.getByLabel("Password").fill(DATA_MANAGER_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/data-portal", { timeout: 15_000 });

    // Click Logout (visible directly in desktop nav bar)
    await page.getByRole("button", { name: /logout/i }).click();

    // After logout, session is cleared — user ends up at /login
    await page.waitForURL("**/login**", { timeout: 10_000 });

    // Verify session is truly cleared: accessing /data-portal still redirects to /login
    await page.goto("/data-portal");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });
});
