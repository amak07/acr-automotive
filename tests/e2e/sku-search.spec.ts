import { test, expect } from "@playwright/test";
import { VALID_ACR_SKUS, SKU_PATTERNS, UI_STRINGS } from "./fixtures/test-data";
import {
  waitForHydration,
  getSearchInput,
  fillSearchInput,
  quickSearch,
} from "./helpers/test-helpers";

/**
 * SKU Search E2E Tests
 *
 * Tests the "Quick Search" tab for ACR SKU and partial SKU searches.
 * Uses local Docker Supabase seed data.
 * Plan: ~/.claude/plans/drifting-foraging-milner.md Section 3.3
 */

test.describe("SKU Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
  });

  test("exact ACR SKU returns the matching part", async ({ page }) => {
    const sku = VALID_ACR_SKUS[0]; // ACR512283
    await quickSearch(page, sku);

    // Should show results containing this SKU
    await expect(page.locator("[data-testid='search-results']")).toContainText(
      sku
    );
    // Should indicate SKU search type (no "matched_vehicles" in response)
    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText(UI_STRINGS.noResults);
  });

  test("each valid ACR SKU returns results", async ({ page }) => {
    // Test a subset to keep runtime reasonable
    for (const sku of VALID_ACR_SKUS.slice(0, 3)) {
      await page.goto("/");
      await waitForHydration(page);
      await quickSearch(page, sku);

      // Wait for results to load
      await expect(
        page.locator("[data-testid='search-results']").getByText(sku).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("partial ACR SKU prefix returns results", async ({ page }) => {
    // Search for "ACR2302" should match ACR2302006 and ACR2302007
    await quickSearch(page, "ACR2302");

    await expect(page.locator("[data-testid='search-results']")).toContainText(
      "ACR2302006"
    );
    await expect(page.locator("[data-testid='search-results']")).toContainText(
      "ACR2302007"
    );
  });

  test("pure digit search is treated as SKU search", async ({ page }) => {
    // "518507" should find ACR518507 via SKU search (not vehicle keyword)
    await quickSearch(page, "518507");

    await expect(page.locator("[data-testid='search-results']")).toContainText(
      "ACR518507"
    );
    await expect(
      page.locator("[data-testid='search-results']")
    ).not.toContainText(UI_STRINGS.noResults);
  });

  test("case-insensitive SKU search works", async ({ page }) => {
    // "acr2302006" lowercase should find the part
    await quickSearch(page, "acr2302006");

    await expect(page.locator("[data-testid='search-results']")).toContainText(
      "ACR2302006"
    );
  });

  test("SKU search with prefix-number pattern", async ({ page }) => {
    // SKU_PATTERNS.prefixNumber = "WB-123" — pattern matched as SKU, not vehicle
    // This should return no results (no such part) but NOT trigger vehicle search
    await quickSearch(page, SKU_PATTERNS.prefixNumber);

    // Should show empty state since WB-123 doesn't exist
    await expect(page.locator("[data-testid='search-results']")).toContainText(
      UI_STRINGS.noResults
    );
  });

  test("search results show part cards with SKU and type", async ({ page }) => {
    await quickSearch(page, "ACR2302006");

    // Part card should show the SKU
    const partCard = page.locator("a[href*='/parts/ACR2302006']").first();
    await expect(partCard).toBeVisible();

    // Card should contain part type info
    await expect(partCard).toContainText("MAZA");
  });

  test("clicking a result navigates to part detail", async ({ page }) => {
    await quickSearch(page, "ACR2302006");

    // Click the part card link
    const partCard = page.locator("a[href*='/parts/ACR2302006']").first();
    await expect(partCard).toBeVisible();
    await partCard.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/parts\/ACR2302006/);
    // Use heading role with name to avoid strict mode (there are two h1s: header + detail)
    await expect(
      page.getByRole("heading", { name: /ACR2302006/ })
    ).toBeVisible();
  });

  test("search preserves URL params", async ({ page }) => {
    await quickSearch(page, "ACR2302006");

    // URL should contain sku param
    await expect(page).toHaveURL(/sku=ACR2302006/i);
  });

  test("clear search button resets input and results", async ({ page }) => {
    await quickSearch(page, "ACR2302006");

    // Should have results
    await expect(page.locator("[data-testid='search-results']")).toContainText(
      "ACR2302006"
    );

    // Click clear
    await page.getByRole("button", { name: /clear search/i }).click();

    // Input should be empty
    await expect(getSearchInput(page)).toHaveValue("");
  });

  test("Enter key triggers search", async ({ page }) => {
    await fillSearchInput(page, "ACR2302006");
    // Wait for React to process onChange before pressing Enter
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled({ timeout: 10000 });
    await getSearchInput(page).press("Enter");

    // Wait for search to execute
    await page.waitForURL(/[?&]sku=/, { timeout: 10000 });
    await expect(page.locator("[data-testid='search-results']")).toContainText(
      "ACR2302006"
    );
    // Verify it's filtered results, not the full catalog
    await expect(page.locator("[data-testid='search-results']")).toContainText(
      "1 part"
    );
  });
});
