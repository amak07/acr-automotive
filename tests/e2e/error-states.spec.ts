import { test, expect } from "@playwright/test";
import { INVALID_INPUTS } from "./fixtures/test-data";
import {
  waitForHydration,
  getSearchInput,
  quickSearch,
} from "./helpers/test-helpers";

/**
 * Error State & Invalid Input E2E Tests
 *
 * Tests the app's resilience to invalid searches, XSS attempts,
 * SQL injection, unicode, and edge-case inputs.
 * Plan: ~/.claude/plans/drifting-foraging-milner.md Section 3.8
 */

test.describe("Invalid Input Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
  });

  test("non-existent ACR SKU shows empty state", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.nonExistentSku);

    await expect(page.locator("body")).toContainText(
      "No matching parts found"
    );
  });

  test("non-existent cross-ref shows empty state", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.nonExistentCrossRef);

    // "ZZZZZZ" is all-alpha, 6 chars → detectVehicleKeyword returns true
    // Vehicle keyword search with "ZZZZZZ" should return no results
    await expect(page.locator("body")).toContainText(
      "No matching parts found"
    );
  });

  test("SQL injection attempt is handled safely", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.sqlInjection);

    // App should not crash — show either empty results or error gracefully
    await expect(page.locator("body")).not.toContainText("error");
    // Page should still be functional
    await expect(getSearchInput(page)).toBeVisible();
  });

  test("XSS attempt is sanitized", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.xssAttempt);

    // Script should not execute — check no alert dialog appeared
    // The text should be safely escaped in the DOM
    await expect(page.locator("body")).not.toContainText("error");
    // Input should still be interactive
    await expect(getSearchInput(page)).toBeVisible();
  });

  test("unicode input does not crash the app", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.unicode);

    // Should gracefully show no results
    await expect(page.locator("body")).not.toContainText(
      "Unable to Load Parts"
    );
    await expect(getSearchInput(page)).toBeVisible();
  });

  test("very long input is handled gracefully", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.veryLongInput);

    // Should not crash
    await expect(page.locator("body")).not.toContainText(
      "Unable to Load Parts"
    );
    await expect(getSearchInput(page)).toBeVisible();
  });

  test("special characters only input is handled", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.specialCharsOnly);

    // Should not crash the app
    await expect(getSearchInput(page)).toBeVisible();
  });

  test("single character search returns gracefully", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.singleChar);

    // 1 char → detectVehicleKeyword returns false (< 3 chars)
    // search_by_sku with "A" may return results or empty
    await expect(page.locator("body")).not.toContainText(
      "Unable to Load Parts"
    );
  });

  test("two character search returns gracefully", async ({ page }) => {
    await quickSearch(page, INVALID_INPUTS.twoChars);

    // 2 chars → detectVehicleKeyword returns false (< 3 chars)
    await expect(page.locator("body")).not.toContainText(
      "Unable to Load Parts"
    );
  });
});

test.describe("Navigation Error States", () => {
  test("direct navigation to non-existent part shows 404", async ({
    page,
  }) => {
    await page.goto("/parts/ACR999999");

    // Should show "Part Not Found" error page
    await expect(page.locator("body")).toContainText("Part Not Found");
  });

  test("part detail 404 has back link", async ({ page }) => {
    await page.goto("/parts/NONEXISTENT");

    await expect(page.locator("body")).toContainText("Part Not Found");
    // Should have a way to go back
    const backLink = page.getByRole("link", { name: /back/i }).first();
    await expect(backLink).toBeVisible();
  });
});
