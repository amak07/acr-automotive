import { test, expect } from "@playwright/test";
import { TestWorkbookBuilder } from "./helpers/workbook-builder";
import fs from "fs";
import path from "path";

/**
 * Admin Import Smoke Test
 *
 * Validates the happy path: upload a workbook → see diff preview.
 * Full pipeline testing is handled by scripts/stress-test-import.ts.
 */
test.describe("Admin Import -- Smoke", () => {
  test("can upload workbook and see diff preview", async ({ page }) => {
    await page.goto("/admin/import");

    // Page loads with import heading
    await expect(
      page.getByRole("heading", { name: /import catalog data/i })
    ).toBeVisible();

    // Build a minimal valid workbook with 1 new part
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-SMOKE-001",
      part_type: "Brake Rotor",
      status: "Activo",
    });
    const buffer = await builder.toBuffer();

    // Write to tmp file for Playwright file input
    const tmpDir = path.join(process.cwd(), "tests", "e2e", "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, "smoke-import.xlsx");
    fs.writeFileSync(filePath, buffer);

    // Upload via hidden file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for Step 2 (Review Changes) to become active.
    // The diff preview shows change counts like "+ N new"
    await expect(
      page.getByText(/review changes/i).first()
    ).toBeVisible({ timeout: 30_000 });

    // Verify the diff preview shows at least one new part
    await expect(page.getByText(/new/i).first()).toBeVisible();

    // Clean up tmp file
    fs.unlinkSync(filePath);
  });
});
