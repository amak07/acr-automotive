import { test, expect } from "@playwright/test";
import { TestWorkbookBuilder } from "./helpers/workbook-builder";
import {
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
} from "./helpers/db-helpers";
import { createPngBuffer } from "./helpers/image-fixtures";

/**
 * Data Manager Workflow E2E Tests
 *
 * Validates that a data_manager role user can complete all their core workflows:
 * - Navigate to /data-portal
 * - Import workbooks via /data-portal/import
 * - Export catalog via /api/admin/export
 * - Access upload images page at /data-portal/upload-images
 * - Upload images via /api/admin/upload-images
 * - CANNOT access admin-only APIs (settings PUT, user management)
 *
 * Runs in the "db-tests-data-manager" Playwright project with
 * storageState: tests/e2e/.auth/data-manager.json (pre-authenticated as data_manager).
 */

test.describe("Data Manager Workflow", () => {
  test.describe.configure({ mode: "serial" });

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

  // ---------------------------------------------------------------------------
  // Test 1: data_manager can navigate to /data-portal
  // ---------------------------------------------------------------------------
  test("data_manager can navigate to /data-portal", async ({ page }) => {
    await page.goto("/data-portal");

    // Verify page loads with data-portal content (welcome heading for Carlos)
    await expect(
      page.getByRole("heading", { name: /Welcome/i })
    ).toBeVisible({ timeout: 15_000 });

    // Verify URL stays on /data-portal (not redirected away)
    expect(page.url()).toContain("/data-portal");
  });

  // ---------------------------------------------------------------------------
  // Test 2: data_manager can import a workbook via /data-portal/import
  // ---------------------------------------------------------------------------
  test("data_manager can import a workbook via /data-portal/import", async ({
    page,
  }) => {
    // 1. Create workbook with TestWorkbookBuilder (1 new part)
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E2E-DM-001",
      part_type: "Brake Rotor",
      status: "Activo",
    });
    const buffer = await builder.toBuffer();

    // 2. Navigate to /data-portal/import
    await page.goto("/data-portal/import");

    // 3. Upload file, wait for preview
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-dm-import.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });
    await expect(
      page.getByRole("button", { name: /Execute Import/i })
    ).toBeVisible({ timeout: 30_000 });

    // 4. Verify "Part Changes" tab shows the new part
    await expect(page.getByText(/Part Changes\s*\(\d+\)/i)).toBeVisible();
    await page.getByText(/New Parts/i).click();
    await expect(page.getByText("ACR-E2E-DM-001")).toBeVisible();

    // 5. Click "Execute Import"
    await page.getByRole("button", { name: /Execute Import/i }).click();

    // 6. Verify "Import Successful!" message
    await expect(page.getByText("Import Successful!")).toBeVisible({
      timeout: 30_000,
    });
  });

  // ---------------------------------------------------------------------------
  // Test 3: data_manager can export catalog via /api/admin/export
  // ---------------------------------------------------------------------------
  test("data_manager can export catalog via /api/admin/export", async ({
    page,
  }) => {
    // API routes don't go through middleware matcher, so /api/admin/* is accessible
    // requireAuth() allows both admin and data_manager roles
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  // ---------------------------------------------------------------------------
  // Test 4: data_manager can access upload images page
  // ---------------------------------------------------------------------------
  test("data_manager can access upload images page", async ({ page }) => {
    await page.goto("/data-portal/upload-images");

    // Verify page loads (check for upload zone or relevant heading)
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Verify URL stays on /data-portal/upload-images (not redirected)
    expect(page.url()).toContain("/data-portal/upload-images");
  });

  // ---------------------------------------------------------------------------
  // Test 5: data_manager can upload image via /api/admin/upload-images
  // ---------------------------------------------------------------------------
  test("data_manager can upload image via /api/admin/upload-images", async ({
    page,
  }) => {
    // 1. Upload a PNG via multipart POST
    const pngBuffer = createPngBuffer();
    const response = await page.request.post("/api/admin/upload-images", {
      multipart: {
        files: {
          name: "test-dm-upload.png",
          mimeType: "image/png",
          buffer: pngBuffer,
        },
      },
    });

    // 2. Verify status 201
    expect(response.status()).toBe(201);

    // 3. Verify response has uploaded array with url
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.uploaded).toBeDefined();
    expect(body.uploaded.length).toBeGreaterThanOrEqual(1);
    expect(body.uploaded[0].url).toBeTruthy();

    // 4. Clean up: delete the uploaded image
    const uploadedUrl = body.uploaded[0].url;
    const deleteResponse = await page.request.delete(
      "/api/admin/upload-images",
      {
        data: { url: uploadedUrl },
      }
    );
    expect(deleteResponse.status()).toBe(200);
  });

  // Note: data_manager role restrictions (admin-only endpoints) are tested
  // in auth-api-enforcement.spec.ts — no need to duplicate here.
});
