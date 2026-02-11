import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { TestWorkbookBuilder, SHEET_NAMES } from "./helpers/workbook-builder";
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

// Outer serial block: prevents the two inner describe blocks from running
// concurrently on different workers (their snapshot restores do global deletes).
test.describe("Admin Import Tests", () => {
  test.describe.configure({ mode: "serial" });

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
    // Extended timeout: CI renders 75 diff entries slower than local
    await expect(page.getByText(/New Parts/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Updated Parts/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Deleted Parts/i)).toBeVisible({ timeout: 15_000 });

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

// ---------------------------------------------------------------------------
// Excel feature coverage — VA, Alias, Cross-Ref DELETE, Cascade, Image URL,
// Export verification, all-tabs smoke test
// ---------------------------------------------------------------------------
test.describe("Excel feature coverage", () => {
  test.describe.configure({ mode: "serial" });

  let snapshotId: string;

  // Shared test data queried in beforeAll
  let vaParentPart: {
    acr_sku: string;
    part_type: string;
    position_type: string | null;
    abs_type: string | null;
    bolt_pattern: string | null;
    drive_type: string | null;
  };
  let existingVA: {
    make: string;
    model: string;
    start_year: number;
    end_year: number;
  };
  let existingAlias: {
    alias: string;
    canonical_name: string;
    alias_type: string;
  };
  let crossRefPart: {
    acr_sku: string;
    part_type: string;
    position_type: string | null;
    abs_type: string | null;
    bolt_pattern: string | null;
    drive_type: string | null;
    national_sku: string;
  };

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
    const client = getE2EClient();

    // Find a VA + parent ACTIVE part (for VA update/delete & cascade tests)
    const { data: vaRows } = await client
      .from("vehicle_applications")
      .select("part_id, make, model, start_year, end_year")
      .order("created_at")
      .limit(10);
    for (const va of vaRows!) {
      const { data: p } = await client
        .from("parts")
        .select(
          "acr_sku, part_type, position_type, abs_type, bolt_pattern, drive_type"
        )
        .eq("id", va.part_id)
        .eq("workflow_status", "ACTIVE")
        .single();
      if (p) {
        existingVA = {
          make: va.make,
          model: va.model,
          start_year: va.start_year,
          end_year: va.end_year,
        };
        vaParentPart = p;
        break;
      }
    }

    // Find an existing alias (for delete test)
    const { data: aliasRow } = await client
      .from("vehicle_aliases")
      .select("alias, canonical_name, alias_type")
      .limit(1)
      .single();
    existingAlias = aliasRow!;

    // Find a NATIONAL cross-ref with real SKU (for [DELETE] marker test)
    const { data: crRow } = await client
      .from("cross_references")
      .select("acr_part_id, competitor_sku")
      .eq("competitor_brand", "NATIONAL")
      .neq("competitor_sku", "-")
      .limit(1)
      .single();
    const { data: crPartData } = await client
      .from("parts")
      .select(
        "acr_sku, part_type, position_type, abs_type, bolt_pattern, drive_type"
      )
      .eq("id", crRow!.acr_part_id)
      .single();
    crossRefPart = { ...crPartData!, national_sku: crRow!.competitor_sku };
  });

  test.afterAll(async () => {
    if (snapshotId) {
      await restoreE2ESnapshot(snapshotId);
      await deleteE2ESnapshot(snapshotId);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 9: VA add shows in Vehicle Apps tab
  // ---------------------------------------------------------------------------
  test("VA add shows in Vehicle Apps tab", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E2E-VA-ADD-001",
      part_type: "Brake Rotor",
      status: "Activo",
    });
    builder.addVehicleApp({
      acr_sku: "ACR-E2E-VA-ADD-001",
      make: "TOYOTA",
      model: "CAMRY",
      start_year: 2020,
      end_year: 2024,
    });
    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-va-add.xlsx");

    await expect(page.getByText(/Vehicle Apps\s*\(1\)/i)).toBeVisible();
    await page.getByText(/Vehicle Apps\s*\(1\)/i).click();
    await expect(
      page.getByText(/New Vehicle Applications/i)
    ).toBeVisible();
    // Expand the collapsed section to reveal card content
    await page.getByText(/New Vehicle Applications/i).click();
    await expect(page.getByText("TOYOTA")).toBeVisible();
    await expect(page.getByText("CAMRY")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 10: VA update (year range change) shows in Vehicle Apps tab
  // ---------------------------------------------------------------------------
  test("VA update shows in Vehicle Apps tab", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: vaParentPart.acr_sku,
      part_type: vaParentPart.part_type,
      position_type: vaParentPart.position_type ?? undefined,
      abs_type: vaParentPart.abs_type ?? undefined,
      bolt_pattern: vaParentPart.bolt_pattern ?? undefined,
      drive_type: vaParentPart.drive_type ?? undefined,
      status: "Activo",
    });
    builder.addVehicleApp({
      acr_sku: vaParentPart.acr_sku,
      make: existingVA.make,
      model: existingVA.model,
      start_year: existingVA.start_year,
      end_year: existingVA.end_year + 1, // Change end year → triggers update
    });
    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-va-update.xlsx");

    await expect(page.getByText(/Vehicle Apps\s*\(\d+\)/i)).toBeVisible();
    await page.getByText(/Vehicle Apps\s*\(\d+\)/i).click();
    await expect(
      page.getByText(/Updated Vehicle Applications/i)
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 11: VA delete shows in Vehicle Apps tab
  // ---------------------------------------------------------------------------
  test("VA delete shows in Vehicle Apps tab", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: vaParentPart.acr_sku,
      part_type: vaParentPart.part_type,
      position_type: vaParentPart.position_type ?? undefined,
      abs_type: vaParentPart.abs_type ?? undefined,
      bolt_pattern: vaParentPart.bolt_pattern ?? undefined,
      drive_type: vaParentPart.drive_type ?? undefined,
      status: "Activo",
    });
    builder.addVehicleApp({
      acr_sku: vaParentPart.acr_sku,
      make: existingVA.make,
      model: existingVA.model,
      start_year: existingVA.start_year,
      end_year: existingVA.end_year,
      status: "Eliminar",
    });
    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-va-delete.xlsx");

    await expect(page.getByText(/Vehicle Apps\s*\(\d+\)/i)).toBeVisible();
    await page.getByText(/Vehicle Apps\s*\(\d+\)/i).click();
    await expect(
      page.getByText(/Deleted Vehicle Applications/i)
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 12: Alias add shows in Aliases tab
  // ---------------------------------------------------------------------------
  test("alias add shows in Aliases tab", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E2E-ALIAS-ADD-001",
      part_type: "Brake Rotor",
      status: "Activo",
    });
    builder.addAlias({
      alias: "e2e-test-alias",
      canonical_name: "E2E CANONICAL",
      alias_type: "make",
    });
    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-alias-add.xlsx");

    await expect(page.getByText(/Aliases\s*\(1\)/i)).toBeVisible();
    await page.getByText(/Aliases\s*\(1\)/i).click();
    // Expand the "new Aliases" section to reveal card content
    await expect(page.getByText(/new Aliases/i)).toBeVisible();
    await page.getByText(/new Aliases/i).click();
    await expect(page.getByText("e2e-test-alias")).toBeVisible();
    await expect(page.getByText("E2E CANONICAL")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 13: Alias delete shows in Aliases tab
  // ---------------------------------------------------------------------------
  test("alias delete shows in Aliases tab", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E2E-ALIAS-DEL-001",
      part_type: "Brake Rotor",
      status: "Activo",
    });
    builder.addAlias({
      alias: existingAlias.alias,
      canonical_name: existingAlias.canonical_name,
      alias_type: existingAlias.alias_type as "make" | "model",
      status: "Eliminar",
    });
    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-alias-delete.xlsx");

    await expect(page.getByText(/Aliases\s*\(\d+\)/i)).toBeVisible();
    await page.getByText(/Aliases\s*\(\d+\)/i).click();
    await expect(page.getByText(/Deleted\s+Aliases/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 14: Cross-ref [DELETE] marker shows deleted cross-refs
  // ---------------------------------------------------------------------------
  test("cross-ref DELETE marker shows deleted cross-refs", async ({
    page,
  }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: crossRefPart.acr_sku,
      part_type: crossRefPart.part_type,
      position_type: crossRefPart.position_type ?? undefined,
      abs_type: crossRefPart.abs_type ?? undefined,
      bolt_pattern: crossRefPart.bolt_pattern ?? undefined,
      drive_type: crossRefPart.drive_type ?? undefined,
      national_skus: `[DELETE]${crossRefPart.national_sku}`,
      status: "Activo",
    });
    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-crossref-delete.xlsx");

    await expect(
      page.getByRole("tab", { name: /Cross-References/i })
    ).toBeVisible();
    await page.getByRole("tab", { name: /Cross-References/i }).click();
    await expect(
      page.getByText(/Deleted Cross-References/i)
    ).toBeVisible();
    await page.getByText(/Deleted Cross-References/i).click();
    await expect(
      page.getByText(crossRefPart.national_sku, { exact: true })
    ).toBeVisible();
  });

  // NOTE: Cascade delete warning tests (15, 16) deferred to bead acr-automotive-2lf.
  // W5/W6 warning codes are defined but never emitted — UI is ready, generation is missing.

  // ---------------------------------------------------------------------------
  // Test 15: Image URL import creates part_images record
  // ---------------------------------------------------------------------------
  test("image URL import creates part_images record", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E2E-IMG-URL-001",
      part_type: "Brake Rotor",
      status: "Activo",
      image_url_front: "https://example.com/e2e-front.jpg",
    });
    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-image-url.xlsx");

    // Execute the import
    await page.getByRole("button", { name: /Execute Import/i }).click();
    await expect(page.getByText("Import Successful!")).toBeVisible({
      timeout: 30_000,
    });

    // Verify part_images record was created in DB
    const client = getE2EClient();
    const { data: part } = await client
      .from("parts")
      .select("id")
      .eq("acr_sku", "ACR-E2E-IMG-URL-001")
      .single();
    expect(part).toBeTruthy();

    const { data: images } = await client
      .from("part_images")
      .select("view_type, image_url")
      .eq("part_id", part!.id);
    expect(images).toBeTruthy();
    expect(images!.length).toBeGreaterThanOrEqual(1);
    const frontImage = images!.find(
      (img: any) => img.view_type === "front"
    );
    expect(frontImage).toBeTruthy();
    expect(frontImage!.image_url).toContain(
      "example.com/e2e-front.jpg"
    );
  });

  // ---------------------------------------------------------------------------
  // Test 18: Export → re-import round-trip preserves data (hyperlink test)
  // ---------------------------------------------------------------------------
  test("export then re-import shows no changes", async ({ page }) => {
    // Download export
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);
    const exportBuffer = await response.body();

    // Re-upload the same export file
    await page.goto("/admin/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "catalog-export-roundtrip.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: exportBuffer,
    });

    // Should show "No changes detected"
    await expect(page.getByText(/No changes detected/i)).toBeVisible({
      timeout: 30_000,
    });
  });

  // ---------------------------------------------------------------------------
  // Test 19: Export XLSX has correct sheet structure
  // ---------------------------------------------------------------------------
  test("export XLSX has correct sheet structure", async ({ page }) => {
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);
    const exportBuffer = await response.body();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exportBuffer.buffer as ArrayBuffer);

    // 3 worksheets
    expect(workbook.worksheets.length).toBe(3);
    expect(workbook.getWorksheet(SHEET_NAMES.PARTS)).toBeTruthy();
    expect(
      workbook.getWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS)
    ).toBeTruthy();
    expect(workbook.getWorksheet(SHEET_NAMES.ALIASES)).toBeTruthy();

    // Parts sheet has header rows + data
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    expect(partsSheet.rowCount).toBeGreaterThan(3);

    // Row 2 = column headers — verify key columns
    const headerRow = partsSheet.getRow(2);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value || ""));
    });
    expect(headers).toContain("ACR SKU");
    expect(headers).toContain("Part Type");
    expect(headers).toContain("National");
    expect(headers).toContain("Image URL Front");
  });

  // ---------------------------------------------------------------------------
  // Test 20: Mixed import touches all 4 entity tabs
  // ---------------------------------------------------------------------------
  test("mixed import touches all 4 entity tabs", async ({ page }) => {
    const builder = new TestWorkbookBuilder();

    // New part + cross-ref
    builder.addPartWithCrossRefs(
      {
        acr_sku: "ACR-E2E-ALL-TABS-001",
        part_type: "Brake Rotor",
        status: "Activo",
      },
      { national: ["NAT-ALL-TABS-001"] }
    );

    // New VA
    builder.addVehicleApp({
      acr_sku: "ACR-E2E-ALL-TABS-001",
      make: "HONDA",
      model: "CIVIC",
      start_year: 2020,
      end_year: 2024,
    });

    // New alias
    builder.addAlias({
      alias: "e2e-all-tabs-alias",
      canonical_name: "E2E ALL TABS CANONICAL",
      alias_type: "model",
    });

    const buffer = await builder.toBuffer();
    await uploadAndWaitForPreview(page, buffer, "test-all-tabs.xlsx");

    // All 4 entity tabs visible
    await expect(
      page.getByText(/Part Changes\s*\(\d+\)/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Vehicle Apps\s*\(\d+\)/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Cross-References\s*\(\d+\)/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Aliases\s*\(\d+\)/i)
    ).toBeVisible();
  });
});

}); // end outer "Admin Import Tests"
