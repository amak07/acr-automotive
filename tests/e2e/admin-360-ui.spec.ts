import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { SHEET_NAMES } from "./helpers/workbook-builder";
import {
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
} from "./helpers/db-helpers";
import {
  createPngBuffer,
  createJpegBuffer,
  createFrameSet,
} from "./helpers/image-fixtures";

/**
 * 360° Viewer UI Tests (5 tests)
 *
 * Dashboard, Excel integration, and UI upload/delete flows.
 * - Test 6: Dashboard + public display (badges, search, filter, manage link, public viewer)
 * - Test 7: Excel export (360 column shows "Confirmed (24 frames)")
 * - Test 8: Delete + dashboard update (badge changes to "Not uploaded")
 * - Test 9: UI upload + delete (file input, submit, confirm dialog)
 * - Test 10: Validation warning (< 12 frames shows warning, button disabled)
 *
 * Test SKU: ACR10094077 — 0 images, no 360 frames (clean slate)
 */

const TEST_SKU = "ACR10094077";

test.describe("360° Viewer UI Tests", () => {
  test.describe.configure({ mode: "serial" });

  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
  });

  test("Dashboard + public display: badge, search, filter, manage link, public viewer", async ({
    page,
  }) => {
    // Upload 24 frames via API
    const frames = createFrameSet(24);
    const uploadRes = await page.request.post(
      `/api/admin/parts/${TEST_SKU}/360-frames`,
      { multipart: frames, timeout: 30_000 }
    );
    expect(uploadRes.status()).toBe(200);

    // Navigate to 360 dashboard
    await page.goto("/data-portal/360-viewer");
    await page.getByPlaceholder(/search/i).waitFor();

    // Search for SKU — verify badge
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill(TEST_SKU);
    await expect(page.getByText(TEST_SKU)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Confirmed.*24 frames/i)).toBeVisible();

    // Search nonsense — SKU should disappear
    await searchInput.clear();
    await searchInput.fill("ZZZZNONEXISTENT999");
    await expect(page.getByText(TEST_SKU)).not.toBeVisible({ timeout: 3_000 });

    // 3-way filter: "Has 360°" → SKU visible
    await searchInput.clear();
    await page.getByRole("button", { name: /has 360/i }).click();
    await expect(page.getByText(TEST_SKU)).toBeVisible({ timeout: 10_000 });

    // "Missing" → SKU hidden
    await page.getByRole("button", { name: /missing/i }).click();
    await expect(page.getByText(TEST_SKU)).not.toBeVisible({ timeout: 3_000 });

    // "All Parts" → search to find SKU
    await page.getByRole("button", { name: /all parts/i }).click();
    await searchInput.fill(TEST_SKU);
    await expect(page.getByText(TEST_SKU)).toBeVisible({ timeout: 10_000 });

    // Manage Frames link → navigates to admin part page with 360 tab
    await page
      .getByRole("link", { name: /manage frames/i })
      .first()
      .click();
    await expect(page).toHaveURL(/admin\/parts\/.*tab=360viewer/);
    await expect(page.getByTestId("part-360-viewer-section")).toBeVisible();

    // Public page shows 360 viewer
    await page.goto(`/parts/${TEST_SKU}`);
    await expect(
      page.getByRole("img", { name: /360° view/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Excel export: 360 column shows 'Confirmed (24 frames)'", async ({
    page,
  }) => {
    // Frames still exist from previous test
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);

    const exportBuffer = await response.body();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exportBuffer.buffer as ArrayBuffer);

    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    expect(partsSheet).toBeTruthy();

    // Find column indices (row 2 has headers)
    const headerRow = partsSheet.getRow(2);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value || ""));
    });
    const viewer360Idx = headers.indexOf("360 Viewer") + 1;
    expect(viewer360Idx).toBeGreaterThan(0);

    // Find SKU row (data starts at row 4)
    let skuRowValue: string | null = null;
    const skuColIdx = headers.indexOf("ACR SKU") + 1;
    for (let row = 4; row <= partsSheet.rowCount; row++) {
      const skuCell = partsSheet.getRow(row).getCell(skuColIdx);
      if (String(skuCell.value || "").trim() === TEST_SKU) {
        const viewerCell = partsSheet.getRow(row).getCell(viewer360Idx);
        skuRowValue = viewerCell.text || String(viewerCell.value || "");
        break;
      }
    }

    expect(skuRowValue).toBe("Confirmed (24 frames)");
  });

  test("Delete + dashboard update: badge shows 'Not uploaded'", async ({
    page,
  }) => {
    // Delete via API
    const deleteRes = await page.request.delete(
      `/api/admin/parts/${TEST_SKU}/360-frames`
    );
    expect(deleteRes.status()).toBe(200);

    // Navigate to dashboard
    await page.goto("/data-portal/360-viewer");
    await page.getByPlaceholder(/search/i).waitFor();

    // Search for SKU — verify "Not uploaded" badge
    await page.getByPlaceholder(/search/i).fill(TEST_SKU);
    await expect(page.getByText(TEST_SKU)).toBeVisible({ timeout: 10_000 });

    const skuRow = page
      .locator("div")
      .filter({ hasText: TEST_SKU })
      .filter({ hasText: /not uploaded/i });
    await expect(skuRow.first()).toBeVisible();
  });

  test("UI upload + delete: file input, submit, confirm dialog", async ({
    page,
  }) => {
    await page.goto(`/admin/parts/${TEST_SKU}?tab=360viewer`);
    await page.getByTestId("part-360-viewer-section").waitFor();

    // Upload 12 frames via file input
    const files = Array.from({ length: 12 }, (_, i) => ({
      name: `frame-${String(i).padStart(3, "0")}.jpg`,
      mimeType: "image/jpeg",
      buffer: createJpegBuffer(),
    }));

    const fileInput = page
      .getByTestId("part-360-viewer-section")
      .locator('input[type="file"]');
    await fileInput.setInputFiles(files);

    // Submit upload
    const uploadBtn = page.getByRole("button", {
      name: /upload frames \(\d+\)/i,
    });
    await expect(uploadBtn).toBeVisible({ timeout: 10_000 });
    await uploadBtn.click();

    // Verify POST returns 200
    const postResponse = await page.waitForResponse(
      (r) =>
        r.url().includes("/360-frames") && r.request().method() === "POST",
      { timeout: 60_000 }
    );
    expect(postResponse.status()).toBe(200);

    // Poll API until upload completes
    await expect(async () => {
      const res = await page.request.get(
        `/api/admin/parts/${TEST_SKU}/360-frames`
      );
      const body = await res.json();
      expect(body.count).toBe(12);
    }).toPass({ timeout: 60_000 });

    // Delete with confirmation dialog
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /delete/i }).click();

    // Verify empty state returns
    await expect(
      page.getByTestId("part-360-viewer-content").locator("text=Upload")
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Validation warning: < 12 frames shows warning + disabled button", async ({
    page,
  }) => {
    await page.goto(`/admin/parts/${TEST_SKU}?tab=360viewer`);
    await page.getByTestId("part-360-viewer-section").waitFor();

    // Select only 8 PNG files
    const files = Array.from({ length: 8 }, (_, i) => ({
      name: `frame-${String(i).padStart(3, "0")}.png`,
      mimeType: "image/png",
      buffer: createPngBuffer(),
    }));

    const fileInput = page
      .getByTestId("part-360-viewer-section")
      .locator('input[type="file"]');
    await fileInput.setInputFiles(files);

    // Warning should be visible
    await expect(
      page.getByText(/minimum.*12|below.*required|not enough/i)
    ).toBeVisible({ timeout: 5_000 });

    // Upload button should be disabled
    const uploadBtn = page.getByRole("button", {
      name: /upload frames \(\d+\)/i,
    });
    await expect(uploadBtn).toBeDisabled();
  });
});
