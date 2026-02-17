/**
 * Public 360° Viewer Interaction E2E Tests
 *
 * Tests the interactive 360° product viewer on public part detail pages.
 * Covers drag-to-rotate, keyboard navigation, fullscreen mode, and
 * gallery thumbnail switching between 360° view and product photos.
 *
 * Runs in the "db-tests-public-360" Playwright project (DB-mutating, serial, admin auth).
 * Uses snapshot isolation: uploads 360 frames via API, tests public viewer, then restores.
 *
 * Locator notes:
 * - PartImageGallery renders mobile + desktop layouts (CSS hidden/md:hidden),
 *   so "Drag to rotate" text appears twice in DOM. Use .last() for desktop.
 * - The role="img" container has aspect-ratio CSS that Playwright misreports
 *   as hidden. Use content-based waits and page.evaluate() for coordinates.
 *
 * Test SKUs:
 * - ACR10094077: 0 images, 0 360 frames (clean slate for frame upload)
 * - ACR10130968: 4 product images, 0 360 frames (gallery switching tests)
 */

import { test, expect } from "@playwright/test";
import {
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
} from "./helpers/db-helpers";
import { createFrameSet } from "./helpers/image-fixtures";

const SKU_CLEAN = "ACR10094077";
const SKU_WITH_PHOTOS = "ACR10130968";

test.describe("Public 360° Viewer Interaction", () => {
  test.describe.configure({ mode: "serial" });

  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
  });

  test("360 viewer renders as default view with instructions", async ({
    page,
  }) => {
    // Upload 24 frames to the clean SKU via API
    const frames = createFrameSet(24);
    const postRes = await page.request.post(
      `/api/admin/parts/${SKU_CLEAN}/360-frames`,
      { multipart: frames, timeout: 30_000 }
    );
    expect(postRes.status()).toBe(200);

    // Navigate to the public part detail page and wait for preloader to dismiss
    await page.goto(`/parts/${SKU_CLEAN}`);
    await page.waitForSelector('[role="progressbar"]', { state: "hidden", timeout: 15_000 });

    // Wait for the 360 viewer to render (use instruction text as visibility signal —
    // the role="img" container has aspect-ratio CSS that Playwright misreports as hidden)
    await expect(page.getByText(/drag to rotate/i).last()).toBeVisible({
      timeout: 15_000,
    });

    // Verify the fullscreen button is present
    await expect(
      page.getByRole("button", { name: "Enter fullscreen" })
    ).toBeVisible();
  });

  test("drag to rotate changes displayed frame", async ({ page }) => {
    // Frames already uploaded from test 1
    await page.goto(`/parts/${SKU_CLEAN}`);
    await page.waitForSelector('[role="progressbar"]', { state: "hidden", timeout: 15_000 });

    // Wait for the viewer image src to be set (non-empty)
    // .last() targets the desktop layout (mobile + desktop responsive duplicate)
    const viewerImg = page.locator("[role='img'] img").last();
    await expect(viewerImg).toHaveAttribute("src", /.+/, {
      timeout: 15_000,
    });

    // Capture the initial frame src
    const initialSrc = await viewerImg.getAttribute("src");
    expect(initialSrc).toBeTruthy();

    // Get desktop viewer bounding box via JS (last element = desktop layout)
    const box = await page.evaluate(() => {
      const els = document.querySelectorAll('[role="img"]');
      const el = els[els.length - 1];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    expect(box).toBeTruthy();

    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 150, centerY, { steps: 10 });
    await page.mouse.up();

    // The frame should have changed - src should be different
    const newSrc = await viewerImg.getAttribute("src");
    expect(newSrc).toBeTruthy();
    expect(newSrc).not.toBe(initialSrc);

    // The instruction overlay should be gone after interaction
    await expect(page.getByText(/drag to rotate/i).last()).not.toBeVisible();
  });

  test("keyboard arrow keys navigate frames", async ({ page }) => {
    await page.goto(`/parts/${SKU_CLEAN}`);
    await page.waitForSelector('[role="progressbar"]', { state: "hidden", timeout: 15_000 });

    // Wait for the viewer image src to load
    // .last() targets the desktop layout (mobile + desktop responsive duplicate)
    const viewerImg = page.locator("[role='img'] img").last();
    await expect(viewerImg).toHaveAttribute("src", /.+/, {
      timeout: 15_000,
    });

    // Focus the desktop viewer for keyboard events (last element = desktop layout)
    await page.evaluate(() => {
      const els = document.querySelectorAll<HTMLElement>('[role="img"]');
      els[els.length - 1]?.focus();
    });

    // Capture the initial frame src
    const initialSrc = await viewerImg.getAttribute("src");
    expect(initialSrc).toBeTruthy();

    // Press ArrowRight 5 times to advance frames
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowRight");
    }

    // The frame should have changed
    const afterRightSrc = await viewerImg.getAttribute("src");
    expect(afterRightSrc).toBeTruthy();
    expect(afterRightSrc).not.toBe(initialSrc);

    // Press ArrowLeft 5 times to go back
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowLeft");
    }

    // Should be back at (or very close to) the initial frame
    const afterLeftSrc = await viewerImg.getAttribute("src");
    expect(afterLeftSrc).toBe(initialSrc);
  });

  test("fullscreen toggle shows and dismisses overlay", async ({ page }) => {
    await page.goto(`/parts/${SKU_CLEAN}`);
    await page.waitForSelector('[role="progressbar"]', { state: "hidden", timeout: 15_000 });

    // Wait for the viewer to load (use fullscreen button as visibility signal)
    await expect(
      page.getByRole("button", { name: "Enter fullscreen" })
    ).toBeVisible({ timeout: 15_000 });

    // Click the Enter fullscreen button
    await page
      .getByRole("button", { name: "Enter fullscreen" })
      .click();

    // Verify the fullscreen overlay appears (portal to body with fixed positioning)
    const overlay = page.locator(".fixed.inset-0.bg-black");
    await expect(overlay).toBeVisible({ timeout: 5_000 });

    // Verify the Exit fullscreen button is now visible
    await expect(
      page.getByRole("button", { name: "Exit fullscreen" })
    ).toBeVisible();

    // Verify the overlay contains an image element
    const overlayImg = overlay.locator("img");
    await expect(overlayImg).toBeVisible();

    // Click Exit fullscreen to dismiss the overlay
    await page
      .getByRole("button", { name: "Exit fullscreen" })
      .click();

    // Verify the overlay is no longer visible
    await expect(overlay).not.toBeVisible();

    // The normal viewer should be back
    await expect(
      page.getByRole("button", { name: "Enter fullscreen" })
    ).toBeVisible();
  });

  test("gallery shows 360 thumbnail and allows switching to photos", async ({
    page,
  }) => {
    // Upload 24 frames to the SKU that already has 4 product images
    const frames = createFrameSet(24);
    const postRes = await page.request.post(
      `/api/admin/parts/${SKU_WITH_PHOTOS}/360-frames`,
      { multipart: frames, timeout: 30_000 }
    );
    expect(postRes.status()).toBe(200);

    // Navigate to the public part detail page and wait for preloader to dismiss
    await page.goto(`/parts/${SKU_WITH_PHOTOS}`);
    await page.waitForSelector('[role="progressbar"]', { state: "hidden", timeout: 15_000 });

    // Wait for the page heading to confirm we're on the right page
    await expect(
      page.getByRole("heading", { name: SKU_WITH_PHOTOS })
    ).toBeVisible({ timeout: 15_000 });

    // Wait for gallery thumbnails to appear
    // Thumbnails are 72x72 buttons; look for the 360° thumbnail by its overlay text
    const thumbnail360 = page.locator("button").filter({
      hasText: "360°",
    });
    // .last() targets desktop layout (mobile + desktop responsive duplicate)
    await expect(thumbnail360.last()).toBeVisible({ timeout: 15_000 });

    // Verify multiple thumbnail buttons are visible (360° + at least one photo)
    // Photo thumbnails contain an <img> but no "360°" text
    const allThumbnailButtons = page
      .locator("button")
      .filter({ has: page.locator("img") });
    const thumbnailCount = await allThumbnailButtons.count();
    // Should have at least 2: the 360° thumbnail + at least one photo thumbnail
    expect(thumbnailCount).toBeGreaterThanOrEqual(2);

    // The default main view should be the 360° viewer (since 360 frames are available)
    await expect(page.getByText(/drag to rotate/i).last()).toBeVisible({ timeout: 15_000 });

    // Click a photo thumbnail (one that does NOT have "360°" text)
    // Filter for thumbnails that have an img but NOT the 360° text
    const photoThumbnails = page
      .locator("button")
      .filter({ has: page.locator("img") })
      .filter({ hasNotText: "360°" });
    const photoThumbCount = await photoThumbnails.count();
    expect(photoThumbCount).toBeGreaterThan(0);

    await photoThumbnails.last().click();

    // After clicking a photo thumbnail, the 360° viewer should no longer be the main view
    // The "Drag to rotate" text should not be visible, and the role="img" from Part360Viewer
    // should be replaced by a static photo view
    await expect(page.getByText(/drag to rotate/i).last()).not.toBeVisible();

    // Click the 360° thumbnail to switch back
    await thumbnail360.last().click();

    // The 360° viewer should be back (instruction text reappears on fresh render)
    await expect(page.getByText(/drag to rotate/i).last()).toBeVisible({ timeout: 15_000 });
  });
});
