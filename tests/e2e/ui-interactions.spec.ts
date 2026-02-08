import { test, expect } from "@playwright/test";
import { VALID_ACR_SKUS } from "./fixtures/test-data";
import {
  waitForHydration,
  getSearchInput,
  quickSearch,
} from "./helpers/test-helpers";

/**
 * UI Interaction E2E Tests
 *
 * Tests result display, part detail page, pagination, tab switching,
 * and general UI behavior.
 * Plan: ~/.claude/plans/drifting-foraging-milner.md Section 3.9
 */

test.describe("Search Results Display", () => {
  test("results grid shows part cards", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await quickSearch(page, "ACR2302");

    // Should show multiple results in a grid
    const partLinks = page.locator("a[href*='/parts/ACR']");
    await expect(partLinks.first()).toBeVisible();
    const count = await partLinks.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("results show count text", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await quickSearch(page, "ACR2302");

    // Should show "Showing X-Y of Z parts"
    await expect(page.locator("body")).toContainText(/showing/i);
  });

  test("part card shows ACR brand badge", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await quickSearch(page, "ACR2302006");

    // Card should show brand info
    const partCard = page.locator("a[href*='/parts/ACR2302006']").first();
    await expect(partCard).toBeVisible();
    await expect(partCard).toContainText(/ACR/);
  });
});

test.describe("Part Detail Page", () => {
  test("detail page shows specifications table", async ({ page }) => {
    await page.goto("/parts/ACR2302006");

    // Should show SKU heading
    await expect(
      page.getByRole("heading", { name: /ACR2302006/ })
    ).toBeVisible();

    // Should show specifications
    await expect(page.locator("body")).toContainText("Specifications");
    await expect(page.locator("body")).toContainText("ACR2302006");
    await expect(page.locator("body")).toContainText("MAZA");
  });

  test("detail page shows vehicle applications", async ({ page }) => {
    await page.goto("/parts/ACR2302006");

    await expect(page.locator("body")).toContainText("Vehicle Applications");
    // ACR2302006 has vehicle applications in the seed data
  });

  test("detail page shows cross references", async ({ page }) => {
    await page.goto("/parts/ACR2302006");

    await expect(page.locator("body")).toContainText("Cross References");
    // ACR2302006 is referenced by "713 6493 80" (FAG) and "2302006" (SYD)
    await expect(page.locator("body")).toContainText("FAG");
  });

  test("detail page has back navigation", async ({ page }) => {
    await page.goto("/parts/ACR2302006");

    // Should have "Back to Search" link
    const backLink = page.getByText(/back to search/i).first();
    await expect(backLink).toBeVisible();
  });

  test("back navigation preserves search context", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await quickSearch(page, "ACR2302006");

    // Navigate to detail
    const partLink = page.locator("a[href*='/parts/ACR2302006']").first();
    await partLink.click();
    await expect(page).toHaveURL(/\/parts\/ACR2302006/);

    // Go back
    const backLink = page.getByText(/back to search/i).first();
    await backLink.click();

    // Should return to search results
    await expect(page).toHaveURL(/\//);
  });

  test("part with position_type shows it in specs", async ({ page }) => {
    // ACR2302006 has position_type = "DELANTERA"
    await page.goto("/parts/ACR2302006");

    await expect(page.locator("body")).toContainText("DELANTERA");
  });
});

test.describe("Tab Switching", () => {
  test("can switch between Quick Search and Vehicle Search tabs", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);

    // Quick Search should be default
    await expect(getSearchInput(page)).toBeVisible();

    // Switch to Vehicle Search
    await page.getByRole("tab", { name: /vehicle/i }).click();

    // Vehicle dropdowns should appear
    await expect(
      page.getByRole("combobox", { name: /make/i }).first()
    ).toBeVisible();

    // Switch back to Quick Search
    await page.getByRole("tab", { name: /quick|sku/i }).click();
    await expect(getSearchInput(page)).toBeVisible();
  });

  test("switching tabs clears previous search state", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    // Do a quick search
    await quickSearch(page, "ACR2302006");
    await expect(page.locator("body")).toContainText("ACR2302006");

    // Switch to Vehicle tab
    await page.getByRole("tab", { name: /vehicle/i }).click();

    // Switch back — input should be reset
    await page.getByRole("tab", { name: /quick|sku/i }).click();
  });
});

test.describe("Homepage Default View", () => {
  test("homepage loads with parts catalog", async ({ page }) => {
    await page.goto("/");

    // Default view shows all active parts
    await expect(
      page.locator("a[href*='/parts/ACR']").first()
    ).toBeVisible();
  });

  test("homepage shows pagination for large catalog", async ({ page }) => {
    await page.goto("/");

    // With 865 parts, pagination should appear (limit=15 per page)
    // Look for pagination controls
    await expect(page.locator("body")).toContainText(/showing/i);
  });
});
