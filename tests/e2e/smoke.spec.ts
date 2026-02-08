import { test, expect } from "@playwright/test";
import { getSearchInput, waitForHydration } from "./helpers/test-helpers";

/**
 * Smoke Tests - Verify basic app functionality
 *
 * These tests verify the Playwright setup is working and the app loads correctly.
 */

test.describe("Smoke Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");

    // Page should load without errors
    await expect(page).toHaveTitle(/ACR/i);
  });

  test("search input is visible", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    await expect(getSearchInput(page)).toBeVisible();
  });

  test("can navigate to parts page", async ({ page }) => {
    await page.goto("/parts");

    // Should show parts listing or search interface
    await expect(page.locator("body")).toContainText(/part|search|catalog/i);
  });
});
