import { test, expect } from "@playwright/test";
import { waitForHydration, quickSearch } from "./helpers/test-helpers";

/**
 * Cross-Reference Search E2E Tests
 *
 * Tests searching by competitor part numbers (e.g., FAG, TMK, ATV, SYD).
 * These are typed into the Quick Search input and resolved via the search_by_sku RPC.
 * Read-only spec — no DB modifications, no snapshot isolation needed.
 * Plan: ~/.claude/plans/drifting-foraging-milner.md Section 3.4
 */

test.describe("Cross-Reference Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
  });

  test("TMK cross-ref finds expected ACR part", async ({ page }) => {
    // TM515072 (TMK) → ACR2306010
    await quickSearch(page, "TM515072");

    await expect(page.locator("body")).toContainText("ACR2306010");
    await expect(page.locator("body")).not.toContainText(
      "No matching parts found"
    );
  });

  test("FAG cross-ref with spaces finds expected ACR part", async ({
    page,
  }) => {
    // "713 6493 80" (FAG) → ACR2302006
    await quickSearch(page, "713 6493 80");

    await expect(page.locator("body")).toContainText("ACR2302006");
  });

  test("SYD pure-digit cross-ref finds expected ACR parts", async ({
    page,
  }) => {
    // "2302006" (SYD) → ACR2302006 (and possibly ACR513254)
    await quickSearch(page, "2302006");

    await expect(page.locator("body")).toContainText("ACR2302006");
  });

  test("ATV cross-ref MC0335 returns results", async ({ page }) => {
    // MC0335 (ATV) → ACR513158, ACR513159 (both ACTIVE)
    await quickSearch(page, "MC0335");

    // Should return results (not empty state)
    await expect(page.locator("body")).not.toContainText(
      "No matching parts found"
    );
    // At least one expected ACR SKU should appear
    await expect(
      page.locator("a[href*='/parts/ACR513158'], a[href*='/parts/ACR513159']").first()
    ).toBeVisible();
  });

  test("ATV cross-ref MC2133-S targeting INACTIVE part returns empty", async ({
    page,
  }) => {
    // MC2133-S (ATV) → ACR512220 (INACTIVE)
    // Since the only target part is INACTIVE, search should return no results
    await quickSearch(page, "MC2133-S");

    await expect(page.locator("body")).toContainText(
      "No matching parts found"
    );
  });

  test("cross-ref result navigates to correct part detail", async ({
    page,
  }) => {
    await quickSearch(page, "TM515072");

    // Click through to part detail
    const partLink = page.locator("a[href*='/parts/ACR2306010']").first();
    await expect(partLink).toBeVisible();
    await partLink.click();

    // Detail page should show cross-references section
    await expect(page).toHaveURL(/\/parts\/ACR2306010/);
    await expect(page.locator("body")).toContainText("Cross References");
    // Should show the original competitor SKU in the cross-refs
    await expect(page.locator("body")).toContainText("TM515072");
    await expect(page.locator("body")).toContainText("TMK");
  });

  test("cross-ref detail page shows vehicle applications", async ({
    page,
  }) => {
    await quickSearch(page, "713 6493 80");

    // Navigate to the part
    const partLink = page.locator("a[href*='/parts/ACR2302006']").first();
    await expect(partLink).toBeVisible();
    await partLink.click();

    await expect(page).toHaveURL(/\/parts\/ACR2302006/);
    // Should show vehicle applications section
    await expect(page.locator("body")).toContainText("Vehicle Applications");
  });
});
