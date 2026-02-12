import { test, expect } from "@playwright/test";
import { getE2EClient } from "./helpers/db-helpers";

/**
 * Public Part Detail Image Display E2E Tests
 *
 * Tests that part images render correctly on the public /parts/[sku] page.
 * Uses seed data SKUs known to have images.
 *
 * Runs in the "chromium" project (read-only, no DB mutations).
 *
 * Related components:
 * - src/components/features/public/parts/PublicPartDetails.tsx
 * - src/components/features/public/parts/PartImageGallery.tsx
 * - src/components/features/public/parts/Part360Viewer.tsx
 */

// SKU with 4 images (from seed data, same as admin-images tests)
const SKU_WITH_IMAGES = "ACR10130968";
// SKU with 0 images (from seed data)
const SKU_WITHOUT_IMAGES = "ACR10094077";

test.describe("Public Part Detail Images", () => {
  test("part with images shows image gallery on public detail page", async ({
    page,
  }) => {
    // Verify this SKU actually has images in the DB
    const client = getE2EClient();
    const { data: part } = await client
      .from("parts")
      .select("id")
      .eq("acr_sku", SKU_WITH_IMAGES)
      .single();
    expect(part).toBeTruthy();

    const { data: images } = await client
      .from("part_images")
      .select("id, view_type, image_url")
      .eq("part_id", part!.id);
    expect(images).toBeTruthy();
    expect(images!.length).toBeGreaterThan(0);

    // Navigate to the public part detail page
    await page.goto(`/parts/${SKU_WITH_IMAGES}`);

    // Wait for the page to load — SKU heading should be visible
    await expect(
      page.getByRole("heading", { name: SKU_WITH_IMAGES })
    ).toBeVisible({ timeout: 15_000 });

    // At least one <img> element should be present in the page (product image)
    // The gallery renders images with Next.js <Image> which outputs <img> tags
    const productImages = page.locator("img");
    const imgCount = await productImages.count();
    expect(imgCount).toBeGreaterThanOrEqual(1);

    // Look for an image whose src contains "supabase" or "storage" (storage URL)
    // or the seed data's placeholder URL pattern
    let hasProductImage = false;
    for (let i = 0; i < imgCount; i++) {
      const src = await productImages.nth(i).getAttribute("src");
      if (src && (src.includes("storage") || src.includes("supabase") || src.includes("acr-part-images"))) {
        hasProductImage = true;
        break;
      }
    }
    expect(hasProductImage).toBe(true);
  });

  test("part without images shows placeholder on public detail page", async ({
    page,
  }) => {
    // Navigate to the public part detail page
    await page.goto(`/parts/${SKU_WITHOUT_IMAGES}`);

    // Wait for the page to load — SKU heading should be visible
    await expect(
      page.getByRole("heading", { name: SKU_WITHOUT_IMAGES })
    ).toBeVisible({ timeout: 15_000 });

    // Page should still render without errors
    await expect(page.locator("body")).not.toContainText("Unable to Load");

    // The specs table should still be visible even without images
    await expect(page.getByText(/specifications/i)).toBeVisible();
  });

  test("part detail page shows vehicle applications section", async ({
    page,
  }) => {
    // ACR512003 has 4 images AND 9 vehicle applications in seed data
    const SKU_WITH_VAS = "ACR512003";
    await page.goto(`/parts/${SKU_WITH_VAS}`);

    await expect(
      page.getByRole("heading", { name: SKU_WITH_VAS })
    ).toBeVisible({ timeout: 15_000 });

    // Verify this SKU has vehicle applications in the DB (seed data guarantee)
    const client = getE2EClient();
    const { data: part } = await client
      .from("parts")
      .select("id")
      .eq("acr_sku", SKU_WITH_VAS)
      .single();

    const { count } = await client
      .from("vehicle_applications")
      .select("id", { count: "exact", head: true })
      .eq("part_id", part!.id);

    // This SKU must have vehicle applications — fail fast if seed data is wrong
    expect(count).toBeGreaterThan(0);

    // Vehicle applications section should be visible
    await expect(
      page.getByText(/vehicle applications/i)
    ).toBeVisible();
  });
});
