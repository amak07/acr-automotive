import { test, expect } from "@playwright/test";
import {
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
  getE2EClient,
} from "./helpers/db-helpers";
import { createFrameSet } from "./helpers/image-fixtures";

/**
 * 360° Viewer API Tests (5 tests)
 *
 * Pure API contract + validation — no browser navigation.
 * - Test 1: Upload lifecycle (POST → GET → DB flags)
 * - Test 2: Replace frames (POST 24 over 12)
 * - Test 3: Delete all frames (DELETE → GET → DB flags reset)
 * - Test 4: Boundary validation (min 12, max 48)
 * - Test 5: 404 for non-existent SKU
 *
 * Test SKU: ACR10094077 — 0 images, no 360 frames (clean slate)
 */

const TEST_SKU = "ACR10094077";

test.describe("360° Viewer API Tests", () => {
  test.describe.configure({ mode: "serial" });

  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
  });

  test("Upload lifecycle: POST 12 → GET → DB flags", async ({ page }) => {
    // POST 12 frames
    const frames = createFrameSet(12);
    const postRes = await page.request.post(
      `/api/admin/parts/${TEST_SKU}/360-frames`,
      { multipart: frames }
    );
    expect(postRes.status()).toBe(200);

    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
    expect(postBody.frameCount).toBe(12);

    // GET — verify 12 ordered frames
    const getRes = await page.request.get(
      `/api/admin/parts/${TEST_SKU}/360-frames`
    );
    expect(getRes.status()).toBe(200);

    const getBody = await getRes.json();
    expect(getBody.frames).toHaveLength(12);
    expect(getBody.count).toBe(12);

    const frameNumbers = getBody.frames.map(
      (f: { frame_number: number }) => f.frame_number
    );
    expect(frameNumbers).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

    // DB flags updated
    const supabase = getE2EClient();
    const { data } = await supabase
      .from("parts")
      .select("has_360_viewer, viewer_360_frame_count")
      .eq("acr_sku", TEST_SKU)
      .single();

    expect(data!.has_360_viewer).toBe(true);
    expect(data!.viewer_360_frame_count).toBe(12);
  });

  test("Replace: POST 24 frames over existing 12", async ({ page }) => {
    const frames = createFrameSet(24);
    const postRes = await page.request.post(
      `/api/admin/parts/${TEST_SKU}/360-frames`,
      { multipart: frames, timeout: 30_000 }
    );
    expect(postRes.status()).toBe(200);

    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
    expect(postBody.frameCount).toBe(24);

    // GET — verify exactly 24 (not 36)
    const getRes = await page.request.get(
      `/api/admin/parts/${TEST_SKU}/360-frames`
    );
    const getBody = await getRes.json();
    expect(getBody.frames).toHaveLength(24);
    expect(getBody.count).toBe(24);

    const frameNumbers = getBody.frames.map(
      (f: { frame_number: number }) => f.frame_number
    );
    expect(frameNumbers).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });

  test("Delete: DELETE → GET empty → DB flags reset", async ({ page }) => {
    // DELETE
    const deleteRes = await page.request.delete(
      `/api/admin/parts/${TEST_SKU}/360-frames`
    );
    expect(deleteRes.status()).toBe(200);

    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);

    // GET — verify empty
    const getRes = await page.request.get(
      `/api/admin/parts/${TEST_SKU}/360-frames`
    );
    const getBody = await getRes.json();
    expect(getBody.frames).toEqual([]);
    expect(getBody.count).toBe(0);

    // DB flags reset
    const supabase = getE2EClient();
    const { data } = await supabase
      .from("parts")
      .select("has_360_viewer, viewer_360_frame_count")
      .eq("acr_sku", TEST_SKU)
      .single();

    expect(data!.has_360_viewer).toBe(false);
    expect(data!.viewer_360_frame_count).toBe(0);
  });

  test("Boundary validation: 11 → 400, 49 → 400", async ({ page }) => {
    // Below minimum (11 frames)
    const tooFew = createFrameSet(11);
    const minRes = await page.request.post(
      `/api/admin/parts/${TEST_SKU}/360-frames`,
      { multipart: tooFew }
    );
    expect(minRes.status()).toBe(400);
    const minBody = await minRes.json();
    expect(minBody.error).toContain("Minimum 12 frames required");

    // Above maximum (49 frames)
    const tooMany = createFrameSet(49);
    const maxRes = await page.request.post(
      `/api/admin/parts/${TEST_SKU}/360-frames`,
      { multipart: tooMany }
    );
    expect(maxRes.status()).toBe(400);
    const maxBody = await maxRes.json();
    expect(maxBody.error).toContain("Maximum 48 frames allowed");
  });

  test("404 for non-existent SKU", async ({ page }) => {
    const res = await page.request.get(
      `/api/admin/parts/FAKE-SKU-999/360-frames`
    );
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body.error).toContain("Part not found");
  });
});
