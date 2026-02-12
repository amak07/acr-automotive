import { test, expect } from "@playwright/test";
import {
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
} from "./helpers/db-helpers";
import {
  createPngBuffer,
  createJpegBuffer,
  createOversizedBuffer,
  TEXT_FILE,
} from "./helpers/image-fixtures";

/**
 * Admin Image Management E2E Tests
 *
 * Tests the 4-slot image model (front/back/top/other):
 * - Section A: API contract (GET/POST/DELETE)
 * - Section B: UI rendering (slot states, counter badge)
 * - Section C: UI upload/delete flows (full user interaction)
 * - Section D: Client-side validation (file type, file size)
 *
 * Test SKUs (from seed data):
 * - ACR10130968: 4 images (all slots filled)
 * - ACR512133:   2 images (front + other)
 * - ACR10094077: 0 images (empty, used for mutating tests)
 */

// SKU constants
const SKU_4_IMAGES = "ACR10130968";
const SKU_2_IMAGES = "ACR512133";
const SKU_0_IMAGES = "ACR10094077";

test.describe("Admin Image Management Tests", () => {
  test.describe.configure({ mode: "serial" });

  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
  });

  // ---------------------------------------------------------------------------
  // Section A: API Tests (7 tests) — via page.request
  // ---------------------------------------------------------------------------

  test.describe("A: API Contract", () => {
    test("A1: GET part with 4 images returns all slots", async ({ page }) => {
      const res = await page.request.get(
        `/api/admin/parts/${SKU_4_IMAGES}/images`
      );
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body.data).toHaveLength(4);

      const viewTypes = body.data.map(
        (img: { view_type: string }) => img.view_type
      );
      expect(viewTypes).toEqual(
        expect.arrayContaining(["front", "back", "top", "other"])
      );

      // Front image should be primary
      const frontImg = body.data.find(
        (img: { view_type: string }) => img.view_type === "front"
      );
      expect(frontImg.is_primary).toBe(true);

      // Should be ordered by display_order
      const orders = body.data.map(
        (img: { display_order: number }) => img.display_order
      );
      const sorted = [...orders].sort((a: number, b: number) => a - b);
      expect(orders).toEqual(sorted);
    });

    test("A2: GET part with 0 images returns empty array", async ({
      page,
    }) => {
      const res = await page.request.get(
        `/api/admin/parts/${SKU_0_IMAGES}/images`
      );
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body.data).toEqual([]);
    });

    test("A3: POST upload to empty slot succeeds", async ({ page }) => {
      const res = await page.request.post(
        `/api/admin/parts/${SKU_0_IMAGES}/images`,
        {
          multipart: {
            file: {
              name: "test-front.png",
              mimeType: "image/png",
              buffer: createPngBuffer(),
            },
            view_type: "front",
          },
        }
      );
      expect(res.status()).toBe(201);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.replaced).toBe(false);
      expect(body.image.view_type).toBe("front");

      // Verify via GET
      const verify = await page.request.get(
        `/api/admin/parts/${SKU_0_IMAGES}/images`
      );
      const verifyBody = await verify.json();
      expect(verifyBody.data).toHaveLength(1);
    });

    test("A4: POST upload to occupied slot replaces", async ({ page }) => {
      // Front slot was filled by A3
      const res = await page.request.post(
        `/api/admin/parts/${SKU_0_IMAGES}/images`,
        {
          multipart: {
            file: {
              name: "test-front-replaced.png",
              mimeType: "image/png",
              buffer: createPngBuffer(),
            },
            view_type: "front",
          },
        }
      );
      expect(res.status()).toBe(201);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.replaced).toBe(true);

      // Still 1 image (replaced, not added)
      const verify = await page.request.get(
        `/api/admin/parts/${SKU_0_IMAGES}/images`
      );
      const verifyBody = await verify.json();
      expect(verifyBody.data).toHaveLength(1);
    });

    test("A5: DELETE image empties the slot", async ({ page }) => {
      // Get the image ID first
      const listRes = await page.request.get(
        `/api/admin/parts/${SKU_0_IMAGES}/images`
      );
      const listBody = await listRes.json();
      const imageId = listBody.data[0].id;

      const res = await page.request.delete(
        `/api/admin/parts/${SKU_0_IMAGES}/images/${imageId}`
      );
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);

      // Verify empty
      const verify = await page.request.get(
        `/api/admin/parts/${SKU_0_IMAGES}/images`
      );
      const verifyBody = await verify.json();
      expect(verifyBody.data).toHaveLength(0);
    });

    test("A6: POST with invalid view_type returns 400", async ({ page }) => {
      const res = await page.request.post(
        `/api/admin/parts/${SKU_0_IMAGES}/images`,
        {
          multipart: {
            file: {
              name: "test.png",
              mimeType: "image/png",
              buffer: createPngBuffer(),
            },
            view_type: "invalid_slot",
          },
        }
      );
      expect(res.status()).toBe(400);

      const body = await res.json();
      expect(body.error).toContain("view_type");
    });

    test("A7: POST with oversized file returns 400", async ({ page }) => {
      const res = await page.request.post(
        `/api/admin/parts/${SKU_0_IMAGES}/images`,
        {
          multipart: {
            file: {
              name: "huge.png",
              mimeType: "image/png",
              buffer: createOversizedBuffer(),
            },
            view_type: "front",
          },
        }
      );
      // Server may return 400 (our validation) or 413 (body limit)
      expect([400, 413]).toContain(res.status());
    });
  });

  // ---------------------------------------------------------------------------
  // Section B: UI Rendering Tests (4 tests) — read-only navigation
  // ---------------------------------------------------------------------------

  test.describe("B: UI Rendering", () => {
    test("B1: Part with 4 images shows all filled slots", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_4_IMAGES}`);

      const section = page.getByTestId("part-images-section");
      await expect(section).toBeVisible();

      // All 4 slots have <img>
      for (const slot of ["front", "back", "top", "other"]) {
        await expect(
          page.getByTestId(`image-slot-${slot}`).locator("img")
        ).toBeVisible();
      }

      // Badge shows 4/4
      await expect(page.getByTestId("part-images-header")).toContainText(
        "4/4"
      );

      // Front slot has yellow star (primary indicator)
      const frontSlot = page.getByTestId("image-slot-front");
      await expect(frontSlot.locator("svg.text-yellow-400")).toBeVisible();
    });

    test("B2: Part with 0 images shows empty slots", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_0_IMAGES}`);

      const section = page.getByTestId("part-images-section");
      await expect(section).toBeVisible();

      // No slot has <img>
      for (const slot of ["front", "back", "top", "other"]) {
        await expect(
          page.getByTestId(`image-slot-${slot}`).locator("img")
        ).not.toBeVisible();
      }

      // Badge shows 0/4
      await expect(page.getByTestId("part-images-header")).toContainText(
        "0/4"
      );
    });

    test("B3: Part with 2 images shows mixed slots", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_2_IMAGES}`);

      const section = page.getByTestId("part-images-section");
      await expect(section).toBeVisible();

      // Front and other have images
      await expect(
        page.getByTestId("image-slot-front").locator("img")
      ).toBeVisible();
      await expect(
        page.getByTestId("image-slot-other").locator("img")
      ).toBeVisible();

      // Back and top are empty
      await expect(
        page.getByTestId("image-slot-back").locator("img")
      ).not.toBeVisible();
      await expect(
        page.getByTestId("image-slot-top").locator("img")
      ).not.toBeVisible();

      // Badge shows 2/4
      await expect(page.getByTestId("part-images-header")).toContainText(
        "2/4"
      );
    });

    test("B4: Images section is visible on part detail page", async ({
      page,
    }) => {
      await page.goto(`/admin/parts/${SKU_4_IMAGES}`);

      // Section is visible without any extra navigation
      await expect(page.getByTestId("part-images-section")).toBeVisible();

      // Content grid is present with 4 slots
      const content = page.getByTestId("part-images-content");
      await expect(content).toBeVisible();
      await expect(content.getByTestId(/^image-slot-/)).toHaveCount(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Section C: UI Upload/Delete Flow Tests (5 tests) — uses SKU_0_IMAGES
  // ---------------------------------------------------------------------------

  test.describe("C: UI Upload/Delete Flows", () => {
    test("C1: Upload to empty slot shows image", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_0_IMAGES}`);
      await expect(page.getByTestId("part-images-section")).toBeVisible();

      // Front slot starts empty (no <img>)
      const frontSlot = page.getByTestId("image-slot-front");
      await expect(frontSlot.locator("img")).not.toBeVisible();

      // Upload via file input
      await frontSlot
        .locator('input[type="file"]')
        .setInputFiles({
          name: "photo-front.png",
          mimeType: "image/png",
          buffer: createPngBuffer(),
        });

      // Wait for image to appear in slot
      await expect(frontSlot.locator("img")).toBeVisible({ timeout: 15_000 });

      // Badge updates to 1/4
      await expect(page.getByTestId("part-images-header")).toContainText(
        "1/4"
      );
    });

    test("C2: Upload to second slot updates counter", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_0_IMAGES}`);
      await expect(page.getByTestId("part-images-section")).toBeVisible();

      // Front should have image from C1
      await expect(
        page.getByTestId("image-slot-front").locator("img")
      ).toBeVisible();

      // Upload to back slot
      const backSlot = page.getByTestId("image-slot-back");
      await backSlot
        .locator('input[type="file"]')
        .setInputFiles({
          name: "photo-back.jpg",
          mimeType: "image/jpeg",
          buffer: createJpegBuffer(),
        });

      // Wait for image to appear
      await expect(backSlot.locator("img")).toBeVisible({ timeout: 15_000 });

      // Badge updates to 2/4
      await expect(page.getByTestId("part-images-header")).toContainText(
        "2/4"
      );
    });

    test("C3: Replace image via hover overlay", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_0_IMAGES}`);
      await expect(page.getByTestId("part-images-section")).toBeVisible();

      const frontSlot = page.getByTestId("image-slot-front");
      await expect(frontSlot.locator("img")).toBeVisible();

      // Capture current image URL
      const oldSrc = await frontSlot.locator("img").getAttribute("src");

      // Upload replacement via the file input (same as initial upload path)
      await frontSlot
        .locator('input[type="file"]')
        .setInputFiles({
          name: "photo-front-v2.png",
          mimeType: "image/png",
          buffer: createPngBuffer(),
        });

      // Wait for image to re-render after mutation + cache invalidation
      await expect(frontSlot.locator("img")).toBeVisible({ timeout: 15_000 });
      // Verify the image URL actually changed (replacement, not no-op)
      await expect(frontSlot.locator("img")).not.toHaveAttribute("src", oldSrc!, { timeout: 10_000 });

      // Counter stays 2/4 (replacement, not addition)
      await expect(page.getByTestId("part-images-header")).toContainText(
        "2/4"
      );
    });

    test("C4: Delete image via confirm dialog (accept)", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_0_IMAGES}`);
      await expect(page.getByTestId("part-images-section")).toBeVisible();

      const backSlot = page.getByTestId("image-slot-back");
      await expect(backSlot.locator("img")).toBeVisible();

      // Register dialog handler BEFORE triggering delete
      page.on("dialog", (dialog) => dialog.accept());

      // Hover to reveal overlay, then click delete button (red bg with X icon)
      await backSlot.hover();
      await backSlot.locator("button.bg-red-600").click({ force: true });

      // Wait for image to disappear from back slot
      await expect(backSlot.locator("img")).not.toBeVisible({
        timeout: 15_000,
      });

      // Badge updates to 1/4
      await expect(page.getByTestId("part-images-header")).toContainText(
        "1/4"
      );
    });

    test("C5: Cancel delete preserves image", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_0_IMAGES}`);
      await expect(page.getByTestId("part-images-section")).toBeVisible();

      const frontSlot = page.getByTestId("image-slot-front");
      await expect(frontSlot.locator("img")).toBeVisible();

      // Register dialog handler to DISMISS (cancel)
      page.on("dialog", (dialog) => dialog.dismiss());

      // Hover and click delete
      await frontSlot.hover();
      const redDeleteBtn = frontSlot.locator("button.bg-red-600");
      await redDeleteBtn.click({ force: true });

      // Brief wait to ensure nothing changes
      await page.waitForTimeout(1000);

      // Image should still be present
      await expect(frontSlot.locator("img")).toBeVisible();

      // Badge stays 1/4
      await expect(page.getByTestId("part-images-header")).toContainText(
        "1/4"
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Section D: Client Validation Tests (2 tests)
  // ---------------------------------------------------------------------------

  test.describe("D: Client Validation", () => {
    test("D1: Non-image file shows error toast", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_0_IMAGES}`);
      await expect(page.getByTestId("part-images-section")).toBeVisible();

      // Use back slot (empty after C4)
      const backSlot = page.getByTestId("image-slot-back");
      await expect(backSlot.locator("img")).not.toBeVisible();

      await backSlot
        .locator('input[type="file"]')
        .setInputFiles({
          name: TEXT_FILE.name,
          mimeType: TEXT_FILE.mimeType,
          buffer: TEXT_FILE.buffer,
        });

      // Error toast appears with "not an image" message
      await expect(
        page.getByText("test.txt: not an image file", { exact: true })
      ).toBeVisible({ timeout: 5_000 });

      // Slot remains empty
      await expect(backSlot.locator("img")).not.toBeVisible();
    });

    test("D2: Oversized file shows error toast", async ({ page }) => {
      await page.goto(`/admin/parts/${SKU_0_IMAGES}`);
      await expect(page.getByTestId("part-images-section")).toBeVisible();

      // Use back slot (still empty)
      const backSlot = page.getByTestId("image-slot-back");
      await expect(backSlot.locator("img")).not.toBeVisible();

      await backSlot
        .locator('input[type="file"]')
        .setInputFiles({
          name: "huge.png",
          mimeType: "image/png",
          buffer: createOversizedBuffer(),
        });

      // Error toast appears with "too large" message
      await expect(
        page.getByText("huge.png: file too large (max 5MB)", { exact: true })
      ).toBeVisible({ timeout: 5_000 });

      // Slot remains empty
      await expect(backSlot.locator("img")).not.toBeVisible();
    });
  });
});
