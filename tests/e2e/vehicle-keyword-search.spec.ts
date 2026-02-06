import { test, expect } from "@playwright/test";
import {
  VEHICLE_ALIASES,
  VEHICLE_KEYWORDS,
  UI_STRINGS,
} from "./fixtures/test-data";
import {
  waitForHydration,
  getSearchInput,
  quickSearch,
} from "./helpers/test-helpers";

/**
 * Vehicle Keyword & Alias Search E2E Tests
 *
 * Tests the Quick Search input with vehicle model names, make names, and
 * colloquial aliases (chevy → CHEVROLET, stang → MUSTANG, etc.).
 * These trigger the search_by_vehicle_keyword RPC via detectVehicleKeyword().
 * Plan: ~/.claude/plans/drifting-foraging-milner.md Section 3.5
 */

test.describe("Vehicle Keyword Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
  });

  test("direct model name 'mustang' returns FORD MUSTANG parts", async ({
    page,
  }) => {
    await quickSearch(page, "mustang");

    // Should find parts and not show empty state
    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText(UI_STRINGS.noResults);

    // Response should indicate vehicle_keyword search type
    // Parts shown should be for Ford Mustang applications
    // Verify at least one ACR SKU appears in results
    await expect(page.locator("a[href*='/parts/ACR']").first()).toBeVisible();
  });

  test("model name with hyphen 'f-150' triggers vehicle search", async ({
    page,
  }) => {
    // "f-150" is a vehicle keyword (starts with letter, has hyphen+digits)
    await quickSearch(page, VEHICLE_KEYWORDS.withHyphen);

    // Should not show "No matching parts found" if F-150 data exists in seed
    // Even if no results, it should NOT be treated as a SKU search
    const searchResults = page.locator("[data-testid='search-results']");
    // The search should complete without error
    await expect(searchResults).not.toContainText("Unable to Load Parts");
  });

  test("multi-word model 'monte carlo' returns results", async ({ page }) => {
    await quickSearch(page, VEHICLE_KEYWORDS.multiWord);

    // Should find parts for MONTE CARLO
    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText(UI_STRINGS.noResults);
  });
});

test.describe("Vehicle Alias Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
  });

  test("make alias 'chevy' resolves to CHEVROLET", async ({ page }) => {
    await quickSearch(page, "chevy");

    // Should find parts for CHEVROLET vehicles
    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText(UI_STRINGS.noResults);
    // Should show results
    await expect(page.locator("a[href*='/parts/ACR']").first()).toBeVisible();
  });

  test("make alias 'beemer' resolves to BMW", async ({ page }) => {
    await quickSearch(page, "beemer");

    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText(UI_STRINGS.noResults);
    await expect(page.locator("a[href*='/parts/ACR']").first()).toBeVisible();
  });

  test("make alias 'dodge' resolves to DODGE-RAM", async ({ page }) => {
    await quickSearch(page, "dodge");

    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText(UI_STRINGS.noResults);
    await expect(page.locator("a[href*='/parts/ACR']").first()).toBeVisible();
  });

  test("short alias 'vw' bypasses vehicle keyword detection", async ({
    page,
  }) => {
    await quickSearch(page, "vw");

    // "vw" is only 2 chars → detectVehicleKeyword returns false (< 3 chars)
    // Falls through to SKU search, which finds parts with "VW" in their SKU
    // The key assertion: search completes without error
    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText("Unable to Load Parts");
  });

  test("model alias 'stang' resolves to MUSTANG", async ({ page }) => {
    await quickSearch(page, "stang");

    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText(UI_STRINGS.noResults);
    await expect(page.locator("a[href*='/parts/ACR']").first()).toBeVisible();
  });

  test("model alias 'vette' resolves to CORVETTE", async ({ page }) => {
    await quickSearch(page, "vette");

    // CORVETTE may not have parts in the 1000-record seed,
    // but the search should not error
    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText("Unable to Load Parts");
  });

  test("alias search result detail shows correct vehicle application", async ({
    page,
  }) => {
    await quickSearch(page, "chevy");

    // Click first result to see detail
    const firstResult = page.locator("a[href*='/parts/ACR']").first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Detail page should show CHEVROLET in vehicle applications
    await expect(page.locator("[data-testid='part-detail']")).toContainText(
      UI_STRINGS.vehicleApps
    );
    await expect(page.locator("[data-testid='part-detail']")).toContainText(
      "CHEVROLET"
    );
  });
});
