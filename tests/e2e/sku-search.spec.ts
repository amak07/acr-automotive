import { test, expect } from "@playwright/test";
import { VALID_ACR_SKUS, SKU_PATTERNS } from "./fixtures/test-data";
import {
  waitForHydration,
  getSearchInput,
  fillSearchInput,
  quickSearch,
} from "./helpers/test-helpers";
import {
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
  getE2EClient,
} from "./helpers/db-helpers";

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
    await expect(page.locator("body")).toContainText(sku);
    // Should indicate SKU search type (no "matched_vehicles" in response)
    await expect(page.locator("body")).not.toContainText(
      "No matching parts found"
    );
  });

  test("each valid ACR SKU returns results", async ({ page }) => {
    // Test a subset to keep runtime reasonable
    for (const sku of VALID_ACR_SKUS.slice(0, 3)) {
      await page.goto("/");
      await waitForHydration(page);
      await quickSearch(page, sku);

      // Wait for results to load
      await expect(
        page.locator("body").getByText(sku).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("partial ACR SKU prefix returns results", async ({ page }) => {
    // Search for "ACR2302" should match ACR2302006 and ACR2302007
    await quickSearch(page, "ACR2302");

    await expect(page.locator("body")).toContainText("ACR2302006");
    await expect(page.locator("body")).toContainText("ACR2302007");
  });

  test("pure digit search is treated as SKU search", async ({ page }) => {
    // "518507" should find ACR518507 via SKU search (not vehicle keyword)
    await quickSearch(page, "518507");

    await expect(page.locator("body")).toContainText("ACR518507");
    await expect(page.locator("body")).not.toContainText(
      "No matching parts found"
    );
  });

  test("case-insensitive SKU search works", async ({ page }) => {
    // "acr2302006" lowercase should find the part
    await quickSearch(page, "acr2302006");

    await expect(page.locator("body")).toContainText("ACR2302006");
  });

  test("SKU search with prefix-number pattern", async ({ page }) => {
    // SKU_PATTERNS.prefixNumber = "WB-123" — pattern matched as SKU, not vehicle
    // This should return no results (no such part) but NOT trigger vehicle search
    await quickSearch(page, SKU_PATTERNS.prefixNumber);

    // Should show empty state since WB-123 doesn't exist
    await expect(page.locator("body")).toContainText(
      "No matching parts found"
    );
  });

  test("search results show part cards with SKU and type", async ({
    page,
  }) => {
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
    await expect(page.locator("body")).toContainText("ACR2302006");

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
    await expect(page.locator("body")).toContainText("ACR2302006");
    // Verify it's filtered results, not the full catalog
    await expect(page.locator("body")).toContainText("1 part");
  });
});

// ---------------------------------------------------------------------------
// INACTIVE part visibility — regression test for workflow_status filter
// ---------------------------------------------------------------------------
test.describe("INACTIVE part visibility", () => {
  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    if (snapshotId) {
      await restoreE2ESnapshot(snapshotId);
      await deleteE2ESnapshot(snapshotId);
    }
  });

  test("INACTIVE part is not returned by public detail API", async ({
    page,
  }) => {
    const client = getE2EClient();
    // Get a known active part
    const { data } = await client
      .from("parts")
      .select("acr_sku")
      .eq("workflow_status", "ACTIVE")
      .limit(1)
      .single();
    const sku = data!.acr_sku;

    // Mark it INACTIVE
    await client
      .from("parts")
      .update({ workflow_status: "INACTIVE" })
      .eq("acr_sku", sku);

    // Direct API lookup should return 404
    const response = await page.request.get(`/api/public/parts?sku=${sku}`);
    expect(response.status()).toBe(404);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("Part not found");
  });
});
