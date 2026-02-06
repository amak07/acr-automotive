import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Wait for React hydration to complete.
 *
 * page.goto() resolves on the `load` event, but React hydration happens
 * after that.  This helper waits for a known element that only renders
 * once React has hydrated, Suspense has resolved, and the initial data
 * fetch has completed — proving the page is fully interactive.
 */
export async function waitForHydration(page: Page) {
  await expect(page.locator("a[href*='/parts/ACR']").first()).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Get the desktop Quick Search text input.
 *
 * PublicSearchFilters renders both a mobile and desktop copy of the input.
 * `.last()` targets the desktop variant (the second in DOM order).
 */
export function getSearchInput(page: Page) {
  return page.getByRole("textbox", { name: /ACR10094077/ }).last();
}

/**
 * Belt-and-suspenders fill that survives React hydration races.
 *
 * 1. Waits for the input to be editable (React must have hydrated)
 * 2. Uses `fill()` (fast, sets value in one shot)
 * 3. Verifies React actually processed the change (`toHaveValue`)
 * 4. If the value didn't stick, falls back to `pressSequentially()` which
 *    types one character at a time — giving React time to bind handlers
 *    between keystrokes.
 */
export async function fillSearchInput(page: Page, term: string) {
  const input = getSearchInput(page);

  // 1. Wait for the input to be editable (hydration must be done)
  await expect(input).toBeEditable({ timeout: 10_000 });

  // 2. Fast fill
  await input.fill(term);

  // 3. Verify React processed the fill
  try {
    await expect(input).toHaveValue(term, { timeout: 2_000 });
  } catch {
    // 4. Fallback: clear and type char-by-char
    await input.clear();
    await input.pressSequentially(term, { delay: 30 });
    await expect(input).toHaveValue(term, { timeout: 3_000 });
  }
}

/**
 * Perform a Quick Search and wait for results to load.
 *
 * Uses fillSearchInput (belt-and-suspenders), waits for the Search button
 * to become enabled, clicks it, then waits for the URL to update.
 */
export async function quickSearch(page: Page, term: string) {
  await fillSearchInput(page, term);

  const searchBtn = page.getByRole("button", { name: "Search", exact: true });
  await expect(searchBtn).toBeEnabled({ timeout: 10_000 });
  await searchBtn.click();

  await page.waitForURL(/[?&]sku=/, { timeout: 10_000 });
}

/**
 * Get the three vehicle comboboxes scoped within the Vehicle Search tab panel.
 * The AcrComboBox aria-label changes based on state (e.g., "Select Make" vs
 * "Please select a make first"), so we use positional indexing within the panel.
 */
export function getVehicleCombos(page: Page) {
  const panel = page.getByRole("tabpanel", { name: /vehicle/i });
  return {
    make: panel.getByRole("combobox").nth(0),
    model: panel.getByRole("combobox").nth(1),
    year: panel.getByRole("combobox").nth(2),
  };
}

export async function selectVehicle(
  page: Page,
  make: string,
  model: string,
  year: number
) {
  const combos = getVehicleCombos(page);

  await combos.make.click();
  await page.getByRole("option", { name: make }).click();

  await combos.model.click();
  await page.getByRole("option", { name: model }).click();

  await combos.year.click();
  await page.getByRole("option", { name: String(year) }).click();
}
