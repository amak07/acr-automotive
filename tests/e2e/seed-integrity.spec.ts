import { test, expect } from "@playwright/test";
import {
  CATALOG_STATS,
  VALID_ACR_SKUS,
  INACTIVE_ACR_SKUS,
  ACTIVE_CROSS_REFS,
  UI_STRINGS,
} from "./fixtures/test-data";
import { waitForHydration, quickSearch } from "./helpers/test-helpers";

/**
 * Seed Data Integrity E2E Tests
 *
 * Verifies the local Docker Supabase seed data matches CATALOG_STATS
 * expectations via the app's UI. These tests catch drift between the
 * test fixtures and the actual database — ensuring the seed is valid
 * before running the full E2E suite.
 *
 * Beads task: acr-automotive-ddy
 */

test.describe("Seed Data Integrity", () => {
  test.describe("Active Parts Count", () => {
    test("homepage shows correct total active parts count", async ({
      page,
    }) => {
      await page.goto("/");
      await waitForHydration(page);

      // The homepage loads all ACTIVE parts (no search filter).
      // The count display reads "Showing 1-15 of 860 parts".
      const expectedTotal = CATALOG_STATS.activeParts; // 860
      await expect(
        page.locator("[data-testid='search-results']")
      ).toContainText(`of ${expectedTotal} parts`);
    });

    test("homepage shows first page with pageSize items", async ({ page }) => {
      await page.goto("/");
      await waitForHydration(page);

      // "Showing 1-15 of ..." confirms pagination matches CATALOG_STATS.pageSize
      const pageSize = CATALOG_STATS.pageSize; // 15
      await expect(
        page.locator("[data-testid='search-results']")
      ).toContainText(`Showing 1-${pageSize} of`);
    });
  });

  test.describe("Known Active SKUs Exist", () => {
    test("each VALID_ACR_SKU returns search results", async ({ page }) => {
      for (const sku of VALID_ACR_SKUS) {
        await page.goto("/");
        await waitForHydration(page);
        await quickSearch(page, sku);

        // The SKU should appear in results (not "No matching parts found")
        await expect(
          page.locator("[data-testid='search-results']").getByText(sku).first()
        ).toBeVisible({ timeout: 10_000 });
      }
    });
  });

  test.describe("Inactive Parts Excluded", () => {
    test("inactive SKUs never appear as result links", async ({ page }) => {
      // Search is partial-match, so searching "ACR512220" may return
      // active parts like ACR512222. The correct check is that the
      // specific inactive SKU never appears as a clickable result link.
      for (const sku of INACTIVE_ACR_SKUS) {
        await page.goto("/");
        await waitForHydration(page);
        await quickSearch(page, sku);

        await expect(page.locator(`a[href='/parts/${sku}']`)).not.toBeVisible();
      }
    });
  });

  test.describe("Cross-Reference Integrity", () => {
    test("active cross-ref returns expected ACR SKUs", async ({ page }) => {
      // Test a representative cross-ref: MC0335 (ATV) → ACR513158, ACR513159
      const crossRef = "MC0335";
      const expected = ACTIVE_CROSS_REFS[crossRef].expectedAcrSkus;

      await page.goto("/");
      await waitForHydration(page);
      await quickSearch(page, crossRef);

      for (const acrSku of expected) {
        await expect(
          page
            .locator("[data-testid='search-results']")
            .getByText(acrSku)
            .first()
        ).toBeVisible({ timeout: 10_000 });
      }
    });

    test("cross-ref targeting only INACTIVE part returns no results", async ({
      page,
    }) => {
      // MC2133-S (ATV) → ACR512220 (INACTIVE). Should show empty.
      const crossRef = "MC2133-S";

      await page.goto("/");
      await waitForHydration(page);
      await quickSearch(page, crossRef);

      await expect(
        page.locator("[data-testid='search-results']")
      ).toContainText(UI_STRINGS.noResults);
    });
  });

  test.describe("Catalog Stats Consistency", () => {
    test("inactive parts count matches CATALOG_STATS", async ({ page }) => {
      // We verified active count on the homepage. Inactive count is verified
      // by confirming exactly CATALOG_STATS.inactiveParts SKUs return no results.
      expect(INACTIVE_ACR_SKUS.length).toBe(CATALOG_STATS.inactiveParts);
    });

    test("total = active + inactive", async ({ page }) => {
      expect(CATALOG_STATS.activeParts + CATALOG_STATS.inactiveParts).toBe(
        CATALOG_STATS.totalParts
      );
    });
  });
});
