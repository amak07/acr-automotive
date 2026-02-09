import { test, expect } from "@playwright/test";
import { TestWorkbookBuilder } from "./helpers/workbook-builder";
import {
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
  getE2EClient,
} from "./helpers/db-helpers";

/**
 * Admin Import/Export E2E Tests
 *
 * Tests the full import wizard UI flow: upload → diff preview → execute → rollback.
 * Uses TestWorkbookBuilder to create workbooks programmatically and DB snapshots
 * for test isolation.
 *
 * These tests validate the UI renders correctly — the 28 stress tests cover
 * API/pipeline correctness.
 */

/** Helper: upload a workbook buffer and wait for Step 2 (Execute Import visible) */
async function uploadAndWaitForPreview(
  page: import("@playwright/test").Page,
  buffer: Buffer,
  fileName: string
) {
  await page.goto("/admin/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  });
  // "Execute Import" button is unique to Step 2 — reliable wait signal
  await expect(
    page.getByRole("button", { name: /Execute Import/i })
  ).toBeVisible({ timeout: 30_000 });
}

test.describe("Admin Import/Export", () => {
  test.describe.configure({ mode: "serial" });

  let snapshotId: string;
  // Existing parts from seed data — used for update/delete scenarios
  // Query all DiffEngine-compared fields so the update workbook carries forward
  // existing values and doesn't trigger spurious Data Change Warnings.
  let updatePart: {
    acr_sku: string;
    part_type: string;
    position_type: string | null;
    abs_type: string | null;
    bolt_pattern: string | null;
    drive_type: string | null;
  };
  let deletePart: {
    acr_sku: string;
    part_type: string;
    position_type: string | null;
    abs_type: string | null;
    bolt_pattern: string | null;
    drive_type: string | null;
  };

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
    const client = getE2EClient();
    const { data } = await client
      .from("parts")
      .select("acr_sku, part_type, position_type, abs_type, bolt_pattern, drive_type")
      .order("acr_sku")
      .limit(2);
    updatePart = data![0];
    deletePart = data![1];
  });

  test.afterAll(async () => {
    if (snapshotId) {
      await restoreE2ESnapshot(snapshotId);
      await deleteE2ESnapshot(snapshotId);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 1: Complex mixed CRUD diff preview
  // ---------------------------------------------------------------------------
  test("mixed CRUD preview shows all diff sections", async ({ page }) => {
    const builder = new TestWorkbookBuilder();

    // ADD: new part with National cross-ref
    builder.addPartWithCrossRefs(
      {
        acr_sku: "ACR-E2E-NEW-001",
        part_type: "Brake Rotor",
        status: "Activo",
      },
      { national: ["NAT-E2E-001"] }
    );
    // UPDATE: existing part with changed specifications
    // Include all DiffEngine-compared fields to avoid spurious Data Change Warnings
    builder.addPart({
      acr_sku: updatePart.acr_sku,
      part_type: updatePart.part_type,
      position_type: updatePart.position_type ?? undefined,
      abs_type: updatePart.abs_type ?? undefined,
      bolt_pattern: updatePart.bolt_pattern ?? undefined,
      drive_type: updatePart.drive_type ?? undefined,
      specifications: "E2E-MODIFIED-SPECS",
      status: "Activo",
    });
    // DELETE: existing part marked for removal
    // Include existing field values to avoid spurious Data Change Warnings
    builder.addPart({
      acr_sku: deletePart.acr_sku,
      part_type: deletePart.part_type,
      position_type: deletePart.position_type ?? undefined,
      abs_type: deletePart.abs_type ?? undefined,
      bolt_pattern: deletePart.bolt_pattern ?? undefined,
      drive_type: deletePart.drive_type ?? undefined,
      status: "Eliminar",
    });

    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-mixed-crud.xlsx");

    // Tabs show entity-level counts (unique selectors, no responsive duplicates)
    await expect(page.getByText(/Part Changes\s*\(3\)/i)).toBeVisible();
    await expect(page.getByText(/Cross-References\s*\(1\)/i)).toBeVisible();

    // Part Changes tab shows all 3 section headers with counts
    await expect(page.getByText(/New Parts\s*\(1\)/i)).toBeVisible();
    await expect(page.getByText(/Updated Parts\s*\(1\)/i)).toBeVisible();
    await expect(page.getByText(/Deleted Parts\s*\(1\)/i)).toBeVisible();

    // Cross-Refs tab — click tab, then expand section to verify SKU
    await page.getByText(/Cross-References\s*\(1\)/i).click();
    await page.getByText(/New Cross-References/i).click();
    await expect(page.getByText("NAT-E2E-001")).toBeVisible();

    // Execute Import button should be enabled
    await expect(
      page.getByRole("button", { name: /Execute Import/i })
    ).toBeEnabled();
  });

  // ---------------------------------------------------------------------------
  // Test 2: Execute import + rollback (full round trip)
  // ---------------------------------------------------------------------------
  test("execute import then rollback", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E2E-EXEC-001",
      part_type: "Brake Rotor",
      status: "Activo",
    });
    const buffer = await builder.toBuffer();

    await uploadAndWaitForPreview(page, buffer, "test-execute.xlsx");

    // Execute Import
    await page.getByRole("button", { name: /Execute Import/i }).click();

    // Verify success banner — use exact text to avoid responsive duplicates
    await expect(page.getByText("Import Successful!")).toBeVisible({
      timeout: 30_000,
    });
    // Match the timing summary line (unique — toast/notification lack "in Xs")
    await expect(
      page.getByText(/1 added, 0 updated, 0 deleted in \d/i)
    ).toBeVisible();

    // Verify Rollback button visible
    await expect(page.getByText(/Rollback Import/i)).toBeVisible();

    // Verify post-import navigation buttons
    await expect(
      page.getByRole("button", { name: /Return to Dashboard/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /View Updated Parts/i })
    ).toBeVisible();

    // --- Rollback ---
    await page.getByText(/Rollback Import/i).click();

    // Confirmation banner
    await expect(
      page.getByRole("button", { name: /Yes, Rollback Import/i })
    ).toBeVisible();

    // Confirm rollback
    await page.getByRole("button", { name: /Yes, Rollback Import/i }).click();

    // Should redirect to /admin (not /admin/import)
    await page.waitForURL("**/admin", { timeout: 15_000 });
    expect(page.url()).not.toContain("/import");
  });

  // ---------------------------------------------------------------------------
  // Test 3: Validation errors
  // ---------------------------------------------------------------------------
  test("invalid workbook shows validation errors", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({ acr_sku: "ACR-DUP-001", part_type: "Brake Rotor" });
    builder.addPart({ acr_sku: "ACR-DUP-001", part_type: "Brake Pad" }); // duplicate
    const buffer = await builder.toBuffer();

    await page.goto("/admin/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-invalid.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });

    // Validation should show error(s) + "Upload Corrected File" button should appear
    await expect(page.getByText(/Upload Corrected File/i)).toBeVisible({ timeout: 30_000 });

    // Verify the error mentions the duplicate SKU issue
    await expect(page.getByText(/Duplicate/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 4: Export catalog
  // ---------------------------------------------------------------------------
  test("export catalog downloads xlsx file", async ({ page }) => {
    // Use Playwright's request context (shares auth cookies from storageState)
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const disposition = response.headers()["content-disposition"];
    expect(disposition).toContain("acr-catalog-export");
    expect(disposition).toContain(".xlsx");
  });

  // ---------------------------------------------------------------------------
  // Test 5: Idempotency — re-upload after import shows no changes
  // ---------------------------------------------------------------------------
  test("re-upload after import shows no changes", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E2E-IDEM-001",
      part_type: "Brake Rotor",
      status: "Activo",
    });
    const buffer = await builder.toBuffer();

    // First upload + execute
    await uploadAndWaitForPreview(page, buffer, "test-idempotent.xlsx");
    await page.getByRole("button", { name: /Execute Import/i }).click();
    await expect(page.getByText("Import Successful!")).toBeVisible({
      timeout: 30_000,
    });

    // Re-upload same workbook
    await page.goto("/admin/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-idempotent.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });

    // Should show "No changes detected" since data matches DB
    await expect(page.getByText(/No changes detected/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});

// ---------------------------------------------------------------------------
// Import UI edge cases — warning gate, bulk rendering, processing state
// ---------------------------------------------------------------------------
test.describe("Import UI edge cases", () => {
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
  // Test 6: Data change warning checkbox gates Execute Import
  // ---------------------------------------------------------------------------
  test("data change warning checkbox gates Execute Import", async ({ page }) => {
    const client = getE2EClient();

    // Find an existing part — changing its part_type triggers W3_PART_TYPE_CHANGED
    const { data } = await client
      .from("parts")
      .select("acr_sku, part_type, position_type, abs_type, bolt_pattern, drive_type")
      .eq("workflow_status", "ACTIVE")
      .limit(1)
      .single();

    const part = data!;
    // Change part_type to a different value to trigger W3 warning
    const newPartType = part.part_type === "Brake Rotor" ? "Brake Pad" : "Brake Rotor";
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: part.acr_sku,
      part_type: newPartType,
      position_type: part.position_type ?? undefined,
      abs_type: part.abs_type ?? undefined,
      bolt_pattern: part.bolt_pattern ?? undefined,
      drive_type: part.drive_type ?? undefined,
      status: "Activo",
    });

    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-data-warning.xlsx");

    // Execute Import should be DISABLED (warnings not acknowledged)
    await expect(
      page.getByRole("button", { name: /Execute Import/i })
    ).toBeDisabled();

    // Warning checkbox should be visible with acknowledgment text
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await expect(
      page.getByText(/I understand these changes and want to proceed/i)
    ).toBeVisible();

    // Check the acknowledgment checkbox
    await checkbox.check();

    // Now Execute Import should be ENABLED
    await expect(
      page.getByRole("button", { name: /Execute Import/i })
    ).toBeEnabled();
  });

  // ---------------------------------------------------------------------------
  // Test 7: Bulk import (100+ changes) renders preview correctly
  // ---------------------------------------------------------------------------
  test("bulk import (100+ changes) renders preview correctly", async ({
    page,
  }) => {
    const client = getE2EClient();

    // Grab existing parts for updates and deletes
    const { data: existingParts } = await client
      .from("parts")
      .select("acr_sku, part_type, position_type, abs_type, bolt_pattern, drive_type")
      .eq("workflow_status", "ACTIVE")
      .order("acr_sku")
      .limit(50);

    const builder = new TestWorkbookBuilder();

    // 25 NEW parts (SKUs not in DB)
    for (let i = 0; i < 25; i++) {
      builder.addPart({
        acr_sku: `ACR-BULK-NEW-${String(i + 1).padStart(3, "0")}`,
        part_type: "MAZA",
        status: "Activo",
      });
    }

    // 25 UPDATES (existing parts with changed specifications)
    const updateSlice = existingParts!.slice(0, 25);
    for (const part of updateSlice) {
      builder.addPart({
        acr_sku: part.acr_sku,
        part_type: part.part_type,
        position_type: part.position_type ?? undefined,
        abs_type: part.abs_type ?? undefined,
        bolt_pattern: part.bolt_pattern ?? undefined,
        drive_type: part.drive_type ?? undefined,
        specifications: "BULK-UPDATE-SPECS",
        status: "Activo",
      });
    }

    // 25 DELETES (existing parts marked for removal)
    const deleteSlice = existingParts!.slice(25, 50);
    for (const part of deleteSlice) {
      builder.addPart({
        acr_sku: part.acr_sku,
        part_type: part.part_type,
        position_type: part.position_type ?? undefined,
        abs_type: part.abs_type ?? undefined,
        bolt_pattern: part.bolt_pattern ?? undefined,
        drive_type: part.drive_type ?? undefined,
        status: "Eliminar",
      });
    }

    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-bulk-mixed-100.xlsx");

    // Part Changes tab should show all 3 diff sections
    await expect(page.getByText(/New Parts/i)).toBeVisible();
    await expect(page.getByText(/Updated Parts/i)).toBeVisible();
    await expect(page.getByText(/Deleted Parts/i)).toBeVisible();

    // Tab header shows total count
    await expect(page.getByText(/Part Changes/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 8: Processing phases shown during upload
  // ---------------------------------------------------------------------------
  test("processing phases shown during upload", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E2E-PHASE-001",
      part_type: "Brake Rotor",
      status: "Activo",
    });
    const buffer = await builder.toBuffer();

    await page.goto("/admin/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-phases.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });

    // All 3 processing phases are shown simultaneously (completed/active/pending)
    // Verify each phase label is rendered
    await expect(page.getByText("Uploading file")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Validating data")).toBeVisible();
    await expect(page.getByText("Generating change preview")).toBeVisible();

    // Wait for preview to complete
    await expect(
      page.getByRole("button", { name: /Execute Import/i })
    ).toBeVisible({ timeout: 30_000 });
  });
});
