import { test, expect } from "@playwright/test";
import {
  createPngBuffer,
  createJpegBuffer,
  createOversizedBuffer,
  TEXT_FILE,
} from "./helpers/image-fixtures";

/**
 * Upload Images Dashboard E2E Tests
 *
 * Tests the standalone image upload workflow at /admin/upload-images where users
 * drag-drop images, get public URLs, and paste them into Excel.
 *
 * - Component: UploadImagesDashboard (src/components/features/admin/upload-images/)
 * - API: POST /api/admin/upload-images (upload), DELETE /api/admin/upload-images (remove)
 * - Storage: Supabase bucket `acr-part-images`
 * - Persistence: localStorage key `acr-upload-images-session`
 * - Allowed types: image/jpeg, image/png, image/webp (max 5MB)
 *
 * Runs in the `db-tests-upload-dashboard` Playwright project with admin storageState.
 *
 * NOTE: Each test gets a fresh browser context, so localStorage does NOT persist
 * between tests. Each test that needs uploaded images must upload them itself.
 */

const LOCAL_STORAGE_KEY = "acr-upload-images-session";

test.describe("Upload Images Dashboard", () => {
  test.describe.configure({ mode: "serial" });

  // Track uploaded URLs for cleanup after all tests
  let uploadedUrls: string[] = [];

  /** Navigate to upload page with clean localStorage. */
  async function gotoClean(page: import("@playwright/test").Page) {
    await page.goto("/admin/upload-images");
    await page.evaluate(
      (key) => localStorage.removeItem(key),
      LOCAL_STORAGE_KEY
    );
    await page.reload();
    await expect(page.locator('[role="button"]')).toBeVisible();
  }

  /** Upload file(s) and wait for filename to appear. Returns displayed URLs. */
  async function uploadAndTrack(
    page: import("@playwright/test").Page,
    files: Array<{ name: string; mimeType: string; buffer: Buffer }>
  ) {
    const fileInputPayload =
      files.length === 1
        ? { name: files[0].name, mimeType: files[0].mimeType, buffer: files[0].buffer }
        : files.map((f) => ({ name: f.name, mimeType: f.mimeType, buffer: f.buffer }));

    await page.locator('input[type="file"]').setInputFiles(fileInputPayload);

    // Wait for each filename to appear
    for (const f of files) {
      await expect(page.getByText(f.name)).toBeVisible({ timeout: 15_000 });
    }

    // Collect new URLs for cleanup
    const urlElements = page.locator(".font-mono");
    const count = await urlElements.count();
    for (let i = 0; i < count; i++) {
      const text = await urlElements.nth(i).textContent();
      if (
        text &&
        text.match(/storage|supabase/i) &&
        !uploadedUrls.includes(text.trim())
      ) {
        uploadedUrls.push(text.trim());
      }
    }
  }

  test.afterAll(async ({ browser }) => {
    // Clean up uploaded files from storage via API
    if (uploadedUrls.length > 0) {
      const context = await browser.newContext({
        storageState: "tests/e2e/.auth/admin.json",
      });
      const page = await context.newPage();

      for (const url of uploadedUrls) {
        try {
          await page.request.delete("/api/admin/upload-images", {
            data: { url },
          });
        } catch {
          // Best-effort cleanup — file may already be gone
        }
      }

      // Clear localStorage
      await page.goto("/admin/upload-images");
      await page.evaluate(
        (key) => localStorage.removeItem(key),
        LOCAL_STORAGE_KEY
      );

      await context.close();
    }
  });

  // ---------------------------------------------------------------------------
  // Test 1: Page loads with upload zone and empty state
  // ---------------------------------------------------------------------------

  test("page loads with upload zone and empty state", async ({ page }) => {
    await gotoClean(page);

    // Heading contains "Upload" text
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /upload/i
    );

    // Upload zone with role="button" is visible
    await expect(page.locator('[role="button"]')).toBeVisible();

    // Empty state message is visible (no images yet)
    await expect(page.locator("text=/no images/i")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 2: Upload single image shows it in list
  // ---------------------------------------------------------------------------

  test("upload single image shows it in list", async ({ page }) => {
    await gotoClean(page);

    await uploadAndTrack(page, [
      { name: "e2e-test-photo.png", mimeType: "image/png", buffer: createPngBuffer() },
    ]);

    // Verify a URL is displayed
    const urlElement = page.locator(".font-mono").first();
    await expect(urlElement).toBeVisible();
    const urlText = await urlElement.textContent();
    expect(urlText).toBeTruthy();
    expect(urlText!).toMatch(/storage|supabase/i);

    // Empty state should be gone
    await expect(page.locator("text=/no images/i")).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 3: Upload multiple images shows all in list
  // ---------------------------------------------------------------------------

  test("upload multiple images shows all in list", async ({ page }) => {
    await gotoClean(page);

    // Upload 3 files at once
    await uploadAndTrack(page, [
      { name: "e2e-multi-1.jpg", mimeType: "image/jpeg", buffer: createJpegBuffer() },
      { name: "e2e-multi-2.png", mimeType: "image/png", buffer: createPngBuffer() },
      { name: "e2e-multi-3.png", mimeType: "image/png", buffer: createPngBuffer() },
    ]);

    // All 3 URL elements should be visible
    await expect(page.locator(".font-mono")).toHaveCount(3, {
      timeout: 10_000,
    });
  });

  // ---------------------------------------------------------------------------
  // Test 4: Copy URL button works
  // ---------------------------------------------------------------------------

  test("copy URL button works", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await gotoClean(page);

    // Upload a file first
    await uploadAndTrack(page, [
      { name: "e2e-copy-test.png", mimeType: "image/png", buffer: createPngBuffer() },
    ]);

    // Find and click the first copy button
    const copyButtons = page.locator("button", { hasText: /copy/i });
    await expect(copyButtons.first()).toBeVisible();
    await copyButtons.first().click();

    // Verify "Copied" feedback appears
    await expect(
      page.locator("button", { hasText: /copied/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // ---------------------------------------------------------------------------
  // Test 5: Delete image removes it from list
  // ---------------------------------------------------------------------------

  test("delete image removes it from list", async ({ page }) => {
    await gotoClean(page);

    // Upload a file to delete
    await uploadAndTrack(page, [
      { name: "e2e-delete-test.png", mimeType: "image/png", buffer: createPngBuffer() },
    ]);

    // Verify 1 URL element exists
    await expect(page.locator(".font-mono")).toHaveCount(1);

    // Remember the URL for cleanup tracking
    const urlText = await page.locator(".font-mono").first().textContent();

    // Click delete button
    const deleteButton = page.getByRole("button", { name: /delete/i });
    await expect(deleteButton.first()).toBeVisible();
    await deleteButton.first().click();

    // Wait for the URL element to disappear
    await expect(page.locator(".font-mono")).toHaveCount(0, {
      timeout: 15_000,
    });

    // Remove from cleanup tracker since it's already deleted
    if (urlText) {
      uploadedUrls = uploadedUrls.filter((u) => u !== urlText.trim());
    }
  });

  // ---------------------------------------------------------------------------
  // Test 6: Invalid file type shows error
  // ---------------------------------------------------------------------------

  test("invalid file type shows error", async ({ page }) => {
    await gotoClean(page);

    // Upload a text file
    await page.locator('input[type="file"]').setInputFiles({
      name: TEXT_FILE.name,
      mimeType: TEXT_FILE.mimeType,
      buffer: TEXT_FILE.buffer,
    });

    // Error message appears
    const errorContainer = page.locator(".bg-red-50");
    await expect(errorContainer).toBeVisible({ timeout: 10_000 });

    // Verify no image was added (still shows empty state)
    await expect(page.locator("text=/no images/i")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 7: Oversized file shows error
  // ---------------------------------------------------------------------------

  test("oversized file shows error", async ({ page }) => {
    await gotoClean(page);

    // Upload an oversized file (>5MB)
    await page.locator('input[type="file"]').setInputFiles({
      name: "huge-photo.png",
      mimeType: "image/png",
      buffer: createOversizedBuffer(),
    });

    // Error message appears
    const errorContainer = page.locator(".bg-red-50");
    await expect(errorContainer).toBeVisible({ timeout: 10_000 });

    // Verify no image was added (still shows empty state)
    await expect(page.locator("text=/no images/i")).toBeVisible();
  });
});
