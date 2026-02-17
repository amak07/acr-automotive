import { test, expect } from "@playwright/test";
import {
  waitForHydration,
  getSearchInput,
  fillSearchInput,
  quickSearch,
} from "./helpers/test-helpers";

/**
 * End-to-End Search Journey Tests
 *
 * Tests complete user journeys through the search experience:
 * SKU search, cross-ref search, vehicle search, and image display.
 * Each test navigates from search to detail and back, verifying
 * state preservation and correct data rendering.
 *
 * Runs in the "chromium" project (read-only, uses admin auth storageState).
 * No DB mutations.
 */

/**
 * Get the three vehicle comboboxes scoped within the Vehicle Search tab panel.
 */
function getVehicleCombos(page: import("@playwright/test").Page) {
  const panel = page.getByRole("tabpanel", { name: /vehicle/i });
  return {
    make: panel.getByRole("combobox").nth(0),
    model: panel.getByRole("combobox").nth(1),
    year: panel.getByRole("combobox").nth(2),
  };
}

test.describe("End-to-End Search Journeys", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
  });

  test("SKU search → detail → back preserves search context", async ({
    page,
  }) => {
    // Search for a known SKU
    await quickSearch(page, "ACR2302006");
    await expect(page).toHaveURL(/sku=ACR2302006/i);

    // Click the result card to navigate to detail page
    const partCard = page.locator("a[href*='/parts/ACR2302006']").first();
    await expect(partCard).toBeVisible({ timeout: 15_000 });
    await partCard.click();

    // Wait for detail page and verify heading
    await expect(
      page.getByRole("heading", { name: /ACR2302006/ })
    ).toBeVisible({ timeout: 15_000 });

    // Verify Specifications section visible with expected data
    await expect(page.getByText(/specifications/i)).toBeVisible();
    await expect(page.locator("body")).toContainText("MAZA");

    // Verify position type
    await expect(page.locator("body")).toContainText("DELANTERA");

    // Click "Back to Search" link
    await page.getByRole("link", { name: /back to search/i }).click();

    // Verify URL preserves the search context
    await expect(page).toHaveURL(/sku=ACR2302006/i, { timeout: 10_000 });

    // Verify the search input retains the search term
    await expect(getSearchInput(page)).toHaveValue("ACR2302006", {
      timeout: 10_000,
    });
  });

  test("cross-ref search → detail shows cross-reference data", async ({
    page,
  }) => {
    // Search for TMK cross-ref number
    await quickSearch(page, "TM515072");

    // Verify results appear
    await expect(
      page.locator("a[href*='/parts/ACR']").first()
    ).toBeVisible({ timeout: 15_000 });

    // Click the result (should resolve to ACR2306010)
    const partLink = page.locator("a[href*='/parts/ACR2306010']").first();
    await expect(partLink).toBeVisible({ timeout: 15_000 });
    await partLink.click();

    // Wait for detail page
    await expect(page).toHaveURL(/\/parts\/ACR2306010/, { timeout: 15_000 });

    // Verify Cross References section is visible
    await expect(page.getByText(/cross references/i)).toBeVisible({
      timeout: 15_000,
    });

    // Verify the competitor brand and part number appear
    await expect(page.locator("body")).toContainText("TMK");
    await expect(page.locator("body")).toContainText("TM515072");

    // Navigate back to search results
    await page.goBack();

    // Verify we're back on the search page
    await expect(page).toHaveURL(/\//, { timeout: 10_000 });
  });

  test("vehicle search → detail → back preserves dropdown filters", async ({
    page,
  }) => {
    // Switch to Vehicle tab
    await page.getByRole("tab", { name: /vehicle/i }).click();

    const combos = getVehicleCombos(page);

    // Select Make: ACURA
    await combos.make.click();
    await page.getByRole("option", { name: "ACURA" }).click();

    // Wait for Model to become enabled, then select MDX
    await expect(combos.model).toBeEnabled({ timeout: 5_000 });
    await combos.model.click();
    await page.getByRole("option", { name: "MDX" }).click();

    // Wait for Year to become enabled, then select 2020
    await expect(combos.year).toBeEnabled({ timeout: 5_000 });
    await combos.year.click();
    await page.getByRole("option", { name: "2020" }).click();

    // Click Search
    await page.getByRole("button", { name: "Search", exact: true }).click();

    // Wait for URL to update with vehicle params
    await expect(page).toHaveURL(/make=ACURA/, { timeout: 10_000 });

    // Verify at least one result card appears
    const firstResult = page.locator("a[href*='/parts/ACR']").first();
    await expect(firstResult).toBeVisible({ timeout: 15_000 });

    // Click the first result card
    await firstResult.click();

    // Wait for detail page
    await expect(
      page.getByRole("heading", { name: /ACR/ })
    ).toBeVisible({ timeout: 15_000 });

    // Verify Vehicle Applications section shows the searched vehicle
    await expect(page.getByText(/vehicle applications/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("body")).toContainText("ACURA");
    await expect(page.locator("body")).toContainText("MDX");

    // Navigate back
    await page.goBack();

    // Verify URL still has all three vehicle params
    await expect(page).toHaveURL(/make=ACURA/, { timeout: 10_000 });
    await expect(page).toHaveURL(/model=MDX/);
    await expect(page).toHaveURL(/year=2020/);
  });

  test("search result cards display part images", async ({ page }) => {
    // Search for a SKU known to have 4 product images
    await quickSearch(page, "ACR10130968");

    // Wait for results to load
    const resultCard = page.locator("a[href*='/parts/ACR10130968']").first();
    await expect(resultCard).toBeVisible({ timeout: 15_000 });

    // Verify the card contains an <img> element
    const cardImage = resultCard.locator("img");
    await expect(cardImage.first()).toBeVisible({ timeout: 15_000 });

    // Verify the img src contains a storage URL
    const src = await cardImage.first().getAttribute("src");
    expect(src).toBeTruthy();
    // Next.js Image optimization wraps storage URLs as /_next/image?url=<encoded>
    expect(src).toMatch(/\/_next\/image|supabase|127\.0\.0\.1|localhost/);
  });
});
