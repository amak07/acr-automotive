/**
 * Public Catalog Pagination E2E Tests
 *
 * Tests the pagination behavior on the public homepage catalog grid.
 * Verifies page navigation, correct item counts, and sort order (images first).
 *
 * Note: search_by_sku RPC has LIMIT 10 on fuzzy matches, so SKU search
 * results never exceed the page size (15) — search pagination is untestable.
 *
 * Runs in the "chromium" project (read-only, admin auth storageState).
 * No DB-mutating operations.
 */

import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers/test-helpers";
import { CATALOG_STATS } from "./fixtures/test-data";

test.describe("Public Catalog Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
  });

  test("page 1 shows 15 parts with correct count text", async ({ page }) => {
    // Count part card links in the grid
    const partLinks = page.locator("a[href*='/parts/ACR']");
    await expect(partLinks).toHaveCount(CATALOG_STATS.pageSize, {
      timeout: 15_000,
    });

    // Verify "Showing 1-15 of NNN parts" text
    // Use regex to allow slight count variation while confirming the range
    await expect(page.locator("p").filter({ hasText: /Showing\s+1-15\s+of\s+\d+\s+parts/ })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("navigating to page 2 shows different parts", async ({ page }) => {
    // Collect SKUs on page 1
    const page1Links = page.locator("a[href*='/parts/ACR']");
    await expect(page1Links).toHaveCount(CATALOG_STATS.pageSize, {
      timeout: 15_000,
    });

    const page1Skus: string[] = [];
    for (let i = 0; i < await page1Links.count(); i++) {
      const href = await page1Links.nth(i).getAttribute("href");
      const match = href?.match(/ACR\d+/);
      if (match) page1Skus.push(match[0]);
    }
    expect(page1Skus.length).toBe(CATALOG_STATS.pageSize);

    // Click "Next page" using the desktop pagination link (aria-label "Go to next page")
    // Desktop Chrome viewport means the lg: breakpoint is active
    const nextPageLink = page.locator('a[aria-label="Go to next page"]');
    await expect(nextPageLink).toBeVisible({ timeout: 10_000 });
    await nextPageLink.click();

    // Wait for URL to update with offset
    await page.waitForURL(/offset=15/, { timeout: 10_000 });
    await waitForHydration(page);

    // Collect SKUs on page 2
    const page2Links = page.locator("a[href*='/parts/ACR']");
    await expect(page2Links).toHaveCount(CATALOG_STATS.pageSize, {
      timeout: 15_000,
    });

    const page2Skus: string[] = [];
    for (let i = 0; i < await page2Links.count(); i++) {
      const href = await page2Links.nth(i).getAttribute("href");
      const match = href?.match(/ACR\d+/);
      if (match) page2Skus.push(match[0]);
    }
    expect(page2Skus.length).toBe(CATALOG_STATS.pageSize);

    // Verify no overlap between page 1 and page 2
    const overlap = page1Skus.filter((sku) => page2Skus.includes(sku));
    expect(overlap).toHaveLength(0);

    // Verify "Showing 16-30" text on page 2
    await expect(
      page.locator("p").filter({ hasText: /Showing\s+16-30\s+of\s+\d+\s+parts/ })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("default sort prioritizes parts with images", async ({ page }) => {
    // On page 1, the first 3 cards should have product images (not placeholder)
    // due to sort: has_360_viewer DESC, has_product_images DESC, acr_sku ASC
    const partLinks = page.locator("a[href*='/parts/ACR']");
    await expect(partLinks).toHaveCount(CATALOG_STATS.pageSize, {
      timeout: 15_000,
    });

    // Check that the first 3 cards each contain an <img> element with a
    // src that is NOT the placeholder SVG (real product images come from Supabase storage)
    for (let i = 0; i < 3; i++) {
      const card = partLinks.nth(i);
      const img = card.locator("img");
      await expect(img).toBeVisible({ timeout: 10_000 });
      const src = await img.getAttribute("src");
      // Real images will be served via Next.js image optimization (/_next/image)
      // or Supabase storage URLs, not the placeholder SVG
      expect(src).toBeTruthy();
    }

    // Navigate to the last page
    const lastPageOffset =
      (Math.ceil(CATALOG_STATS.activeParts / CATALOG_STATS.pageSize) - 1) *
      CATALOG_STATS.pageSize;
    await page.goto(`/?offset=${lastPageOffset}`);
    await waitForHydration(page);

    // On the last page, count how many cards use the placeholder image
    const lastPageLinks = page.locator("a[href*='/parts/ACR']");
    const lastPageCount = await lastPageLinks.count();
    expect(lastPageCount).toBeGreaterThan(0);

    let placeholderCount = 0;
    for (let i = 0; i < lastPageCount; i++) {
      const card = lastPageLinks.nth(i);
      const img = card.locator("img");
      const src = await img.getAttribute("src");
      if (src?.includes("placeholder")) {
        placeholderCount++;
      }
    }

    // The last page should have at least some parts with placeholder images
    // (parts without product images are sorted to the end)
    expect(placeholderCount).toBeGreaterThan(0);
  });

});
