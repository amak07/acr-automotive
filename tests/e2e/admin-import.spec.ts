import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { TestWorkbookBuilder } from "./helpers/workbook-builder";
import {
  getE2EClient,
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
  cleanupE2EImports,
} from "./helpers/db-helpers";

/**
 * Phase 3: Admin Import E2E Tests
 *
 * Tests the import wizard UI and validation API endpoints.
 *
 * Strategy:
 *  - Happy-path CRUD flows --> test through the full Import Wizard UI
 *  - Validation error/warning edge cases --> test via API for speed
 *
 * All tests use authenticated browser state from auth.setup.ts.
 */

// Describe blocks share database state via snapshots — must run serially
test.describe.configure({ mode: "serial" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert the current wizard step by checking aria-label on the step indicator. */
async function expectCurrentStep(
  page: import("@playwright/test").Page,
  stepPattern: RegExp,
  timeout = 5_000
) {
  await expect(
    page.locator('[aria-label*="current"][aria-current="step"]').first()
  ).toHaveAttribute("aria-label", stepPattern, { timeout });
}

/** Acknowledge any validation warnings checkbox if present (so Execute becomes enabled). */
async function acknowledgeWarningsIfPresent(
  page: import("@playwright/test").Page
) {
  const checkbox = page.locator('input[type="checkbox"]');
  if ((await checkbox.count()) > 0) {
    await checkbox.first().check();
  }
}

const TMP_DIR = path.join(process.cwd(), "tests", "e2e", "tmp");

/** Ensure the tmp directory exists and write a buffer to a temp file. */
function writeTmpFile(name: string, buffer: Buffer): string {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const filePath = path.join(TMP_DIR, name);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/** Build a multipart payload for Playwright's request.post(). */
function fileMultipart(name: string, buffer: Buffer) {
  return {
    multipart: {
      file: {
        name,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer,
      },
    },
  };
}

// ============================================================================
// 1. Admin Import -- Happy Path (UI)
// ============================================================================

test.describe("Admin Import -- Happy Path (UI)", () => {
  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
    await cleanupE2EImports();
  });

  test("import page loads with upload step active", async ({ page }) => {
    await page.goto("/admin/import");

    // Page title
    await expect(
      page.getByRole("heading", { name: /import/i })
    ).toBeVisible();

    // The Upload step indicator should be the active/current step
    await expectCurrentStep(page, /upload/i);
  });

  test("can upload valid workbook and see diff preview", async ({ page }) => {
    await page.goto("/admin/import");

    // Build workbook with 2 new parts (no _id --> treated as adds)
    const builder = new TestWorkbookBuilder();
    builder
      .addPart({
        acr_sku: "ACR-UI-ADD-001",
        part_type: "MAZA",
        status: "Activo",
      })
      .addPart({
        acr_sku: "ACR-UI-ADD-002",
        part_type: "ROTOR",
        status: "Activo",
      });

    const buffer = await builder.toBuffer();
    const filePath = writeTmpFile("test-happy-upload.xlsx", buffer);

    // Upload via the hidden file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for step 2 (Review Changes) to become active
    // The wizard auto-advances after validation + diff generation
    await expectCurrentStep(page, /review/i, 30_000);

    // Verify diff summary shows the 2 new parts
    await expect(page.getByText(/new parts?\s*\(2\)/i)).toBeVisible();
  });

  // BLOCKED: shadcn Checkbox not found by input[type="checkbox"] locator — needs data-testid
  test.fixme("can execute import and see success", async ({ page }) => {
    await page.goto("/admin/import");

    // Build workbook with 1 new part
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-UI-EXEC-001",
      part_type: "MAZA",
      status: "Activo",
    });

    const buffer = await builder.toBuffer();
    const filePath = writeTmpFile("test-happy-execute.xlsx", buffer);

    // Upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for Review step
    await expectCurrentStep(page, /review/i, 30_000);

    // Acknowledge warnings if any, then click Execute Import
    await acknowledgeWarningsIfPresent(page);
    const executeButton = page.getByRole("button", {
      name: /execute import|ejecutar/i,
    });
    await expect(executeButton).toBeEnabled({ timeout: 5_000 });
    await executeButton.click();

    // Wait for success -- the success banner contains "Import Successful" or equivalent
    await expect(
      page.getByText(/import successful|importaci.n exitosa/i)
    ).toBeVisible({ timeout: 30_000 });

    // Verify change pills show +1 ADDED
    await expect(page.getByText(/\+1/)).toBeVisible();
  });

  // BLOCKED: depends on execute working (shadcn Checkbox issue)
  test.fixme("can start new import after success", async ({ page }) => {
    await page.goto("/admin/import");

    // Quick import flow
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-UI-NEWIMPORT-001",
      part_type: "MAZA",
      status: "Activo",
    });

    const buffer = await builder.toBuffer();
    const filePath = writeTmpFile("test-happy-startnew.xlsx", buffer);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for review step, then execute
    await expectCurrentStep(page, /review/i, 30_000);

    await acknowledgeWarningsIfPresent(page);
    const executeButton = page.getByRole("button", {
      name: /execute import|ejecutar/i,
    });
    await expect(executeButton).toBeEnabled({ timeout: 5_000 });
    await executeButton.click();

    // Wait for success
    await expect(
      page.getByText(/import successful|importaci.n exitosa/i)
    ).toBeVisible({ timeout: 30_000 });

    // Click Start New Import
    const startNewButton = page.getByRole("button", {
      name: /start new import|nueva importaci.n/i,
    });
    await startNewButton.click();

    // Verify we return to upload step
    await expectCurrentStep(page, /upload/i, 5_000);
  });

  test("cancel returns to admin dashboard", async ({ page }) => {
    await page.goto("/admin/import");

    // On step 1 the secondary button is "Cancel"
    const cancelButton = page.getByRole("button", {
      name: /cancel|cancelar/i,
    });
    await cancelButton.click();

    // Should navigate to /admin
    await expect(page).toHaveURL(/\/admin$/, { timeout: 5_000 });
  });
});

// ============================================================================
// 2. Admin Import -- Update & Delete (UI / API)
// ============================================================================

test.describe("Admin Import -- Update & Delete", () => {
  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
    await cleanupE2EImports();
  });

  test("updating existing part shows update in diff preview", async ({
    request,
  }) => {
    const supabase = getE2EClient();
    const { data: parts } = await supabase
      .from("parts")
      .select("id, acr_sku, part_type, status, specifications")
      .limit(1);

    expect(parts).toBeTruthy();
    expect(parts!.length).toBeGreaterThan(0);

    const part = parts![0];

    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: part.acr_sku,
      part_type: part.part_type,
      status: part.status || "Activo",
      specifications: "Updated specs for E2E test",
    });
    builder.setPartId(0, part.id);

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/preview", {
      ...fileMultipart("test-update-preview.xlsx", buffer),
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.valid).toBe(true);
    expect(json.diff).toBeTruthy();
    // Should show 1 update for parts (the changed specifications)
    expect(json.diff.summary.totalUpdates).toBeGreaterThanOrEqual(1);
  });

  test("delete via _action shows delete in diff preview", async ({
    request,
  }) => {
    const supabase = getE2EClient();
    const { data: parts } = await supabase
      .from("parts")
      .select("id, acr_sku, part_type, status")
      .limit(1);

    expect(parts).toBeTruthy();
    expect(parts!.length).toBeGreaterThan(0);

    const part = parts![0];

    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: part.acr_sku,
      part_type: part.part_type,
      status: part.status || "Activo",
    });
    builder.setPartId(0, part.id);
    builder.setPartAction(0, "DELETE");

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/preview", {
      ...fileMultipart("test-delete-preview.xlsx", buffer),
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.valid).toBe(true);
    expect(json.diff).toBeTruthy();
    expect(json.diff.summary.totalDeletes).toBeGreaterThanOrEqual(1);
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint
  test.fixme("mixed CRUD import executes correctly", async ({ request }) => {
    const supabase = getE2EClient();

    // Get 2 existing parts -- one to update, one to delete
    const { data: existingParts } = await supabase
      .from("parts")
      .select("id, acr_sku, part_type, status, specifications")
      .limit(2);

    expect(existingParts).toBeTruthy();
    expect(existingParts!.length).toBeGreaterThanOrEqual(2);

    const partToUpdate = existingParts![0];
    const partToDelete = existingParts![1];

    const builder = new TestWorkbookBuilder();

    // New part (add)
    builder.addPart({
      acr_sku: "ACR-MIXED-NEW-001",
      part_type: "MAZA",
      status: "Activo",
    });

    // Updated part
    builder.addPart({
      acr_sku: partToUpdate.acr_sku,
      part_type: partToUpdate.part_type,
      status: partToUpdate.status || "Activo",
      specifications: "Mixed CRUD updated specs",
    });
    builder.setPartId(1, partToUpdate.id);

    // Deleted part
    builder.addPart({
      acr_sku: partToDelete.acr_sku,
      part_type: partToDelete.part_type,
      status: partToDelete.status || "Activo",
    });
    builder.setPartId(2, partToDelete.id);
    builder.setPartAction(2, "DELETE");

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/execute", {
      ...fileMultipart("test-mixed-crud.xlsx", buffer),
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.importId).toBeTruthy();
    expect(json.summary.totalAdds).toBeGreaterThanOrEqual(1);
    expect(json.summary.totalUpdates).toBeGreaterThanOrEqual(1);
    expect(json.summary.totalDeletes).toBeGreaterThanOrEqual(1);

    // Verify DB reflects changes
    const { data: newPart } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", "ACR-MIXED-NEW-001")
      .single();
    expect(newPart).toBeTruthy();

    const { data: updatedPart } = await supabase
      .from("parts")
      .select("specifications")
      .eq("id", partToUpdate.id)
      .single();
    expect(updatedPart?.specifications).toBe("Mixed CRUD updated specs");

    const { data: deletedPart } = await supabase
      .from("parts")
      .select("id")
      .eq("id", partToDelete.id)
      .maybeSingle();
    expect(deletedPart).toBeNull();
  });

  // BUG: acr-automotive-e6g — RollbackService RLS + acr-automotive-jm9 — duplicate cross-ref
  test.fixme("rollback restores database after import", async ({ request }) => {
    const supabase = getE2EClient();

    // Count parts before
    const { count: beforeCount } = await supabase
      .from("parts")
      .select("*", { count: "exact", head: true });

    // Execute a simple add import
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-ROLLBACK-001",
      part_type: "MAZA",
      status: "Activo",
    });

    const buffer = await builder.toBuffer();

    const execResponse = await request.post("/api/admin/import/execute", {
      ...fileMultipart("test-rollback.xlsx", buffer),
    });

    expect(execResponse.status()).toBe(200);
    const execJson = await execResponse.json();
    expect(execJson.success).toBe(true);

    const importId = execJson.importId;

    // Verify part was added
    const { data: addedPart } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", "ACR-ROLLBACK-001")
      .single();
    expect(addedPart).toBeTruthy();

    // Rollback
    const rollbackResponse = await request.post(
      "/api/admin/import/rollback",
      {
        data: { importId },
      }
    );

    expect(rollbackResponse.status()).toBe(200);
    const rollbackJson = await rollbackResponse.json();
    expect(rollbackJson.success).toBe(true);
    expect(rollbackJson.importId).toBe(importId);

    // Verify part was removed after rollback
    const { data: rolledBackPart } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", "ACR-ROLLBACK-001")
      .maybeSingle();
    expect(rolledBackPart).toBeNull();

    // Count should be back to original
    const { count: afterCount } = await supabase
      .from("parts")
      .select("*", { count: "exact", head: true });
    expect(afterCount).toBe(beforeCount);
  });
});

// ============================================================================
// 3. Admin Import -- Validation Errors (API)
// ============================================================================

test.describe("Admin Import -- Validation Errors (API)", () => {
  test("E1: missing hidden ID columns", async ({ request }) => {
    // Build a minimal workbook WITHOUT hidden _id/_action columns
    const wb = new ExcelJS.Workbook();

    // Parts sheet -- only visible columns (no _id, no _action)
    const ps = wb.addWorksheet("Parts");
    ps.columns = [
      { header: "ACR SKU", key: "acr_sku", width: 15 },
      { header: "Part Type", key: "part_type", width: 15 },
      { header: "Status", key: "status", width: 12 },
    ];
    // Add group header row (row 1)
    ps.spliceRows(1, 0, ["", "Part Information", ""]);
    // Add instruction row after column headers (which is now row 2)
    ps.spliceRows(3, 0, ["e.g. ACR15002", "e.g. MAZA", "e.g. Activo"]);
    // Data row
    ps.addRow({ acr_sku: "ACR-E1-001", part_type: "MAZA", status: "Activo" });

    // Vehicle Applications sheet (minimal)
    const vs = wb.addWorksheet("Vehicle Applications");
    vs.columns = [
      { header: "ACR SKU", key: "acr_sku", width: 15 },
      { header: "Make", key: "make", width: 15 },
      { header: "Model", key: "model", width: 15 },
      { header: "Start Year", key: "start_year", width: 10 },
      { header: "End Year", key: "end_year", width: 10 },
    ];

    const arrayBuffer = await wb.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-e1-no-ids.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.valid).toBe(false);
    expect(
      json.errors.some(
        (e: any) => e.code === "E1_MISSING_HIDDEN_COLUMNS"
      )
    ).toBe(true);
  });

  test("E2: duplicate ACR_SKU in file", async ({ request }) => {
    const builder = new TestWorkbookBuilder();
    builder
      .addPart({ acr_sku: "ACR-DUP-001", part_type: "MAZA", status: "Activo" })
      .addPart({
        acr_sku: "ACR-DUP-001",
        part_type: "ROTOR",
        status: "Activo",
      });

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-e2-dup.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.valid).toBe(false);
    expect(
      json.errors.some((e: any) => e.code === "E2_DUPLICATE_ACR_SKU")
    ).toBe(true);
  });

  test("E3: empty required field (ACR_SKU)", async ({ request }) => {
    const builder = new TestWorkbookBuilder();
    // Use type assertion to bypass TS requirement for acr_sku
    builder.addPart({ acr_sku: "", part_type: "MAZA" } as any);

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-e3-empty.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.valid).toBe(false);
    expect(
      json.errors.some((e: any) => e.code === "E3_EMPTY_REQUIRED_FIELD")
    ).toBe(true);
  });

  test("E5: orphaned foreign key (vehicle app references non-existent part)", async ({
    request,
  }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E5-VALID-001",
      part_type: "MAZA",
      status: "Activo",
    });
    // Vehicle app referencing a SKU not in the parts sheet or DB
    builder.addVehicleApp({
      acr_sku: "ACR-NONEXISTENT-999",
      make: "TOYOTA",
      model: "CAMRY",
      start_year: 2020,
      end_year: 2024,
    });

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-e5-orphan.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.valid).toBe(false);
    expect(
      json.errors.some((e: any) => e.code === "E5_ORPHANED_FOREIGN_KEY")
    ).toBe(true);
  });

  test("E6: invalid year range (end_year < start_year)", async ({
    request,
  }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E6-001",
      part_type: "MAZA",
      status: "Activo",
    });
    builder.addVehicleApp({
      acr_sku: "ACR-E6-001",
      make: "TOYOTA",
      model: "CAMRY",
      start_year: 2025,
      end_year: 2020,
    });

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-e6-yearrange.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.valid).toBe(false);
    expect(
      json.errors.some((e: any) => e.code === "E6_INVALID_YEAR_RANGE")
    ).toBe(true);
  });

  test("E20: invalid ACR SKU prefix", async ({ request }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "INVALID-001",
      part_type: "MAZA",
      status: "Activo",
    } as any);

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-e20-prefix.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.valid).toBe(false);
    expect(
      json.errors.some(
        (e: any) => e.code === "E20_INVALID_ACR_SKU_FORMAT"
      )
    ).toBe(true);
  });

  test("E21: invalid _action value", async ({ request }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E21-001",
      part_type: "MAZA",
      status: "Activo",
    });
    builder.setPartAction(0, "INVALID");

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-e21-action.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.valid).toBe(false);
    expect(
      json.errors.some(
        (e: any) => e.code === "E21_INVALID_ACTION_VALUE"
      )
    ).toBe(true);
  });

  test("E22: invalid URL format in image column", async ({ request }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-E22-001",
      part_type: "MAZA",
      status: "Activo",
      image_url_front: "not-a-url",
    });

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-e22-url.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.valid).toBe(false);
    expect(
      json.errors.some((e: any) => e.code === "E22_INVALID_URL_FORMAT")
    ).toBe(true);
  });
});

// ============================================================================
// 4. Admin Import -- Validation Warnings (API)
// ============================================================================

test.describe("Admin Import -- Validation Warnings (API)", () => {
  test("W11: duplicate SKU in brand column", async ({ request }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-W11-001",
      part_type: "MAZA",
      status: "Activo",
      national_skus: "NAT-001;NAT-001",
    });

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-w11-dupbrand.xlsx", buffer),
    });

    const json = await response.json();
    // W11 is a warning, so valid should still be true (assuming no blocking errors)
    // But we might also get E1 because the builder includes hidden columns,
    // so check that at least the warning code is present
    expect(
      json.warnings.some(
        (w: any) => w.code === "W11_DUPLICATE_SKU_IN_BRAND"
      )
    ).toBe(true);
  });

  test("W12: space-delimited SKUs in brand column", async ({ request }) => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-W12-001",
      part_type: "MAZA",
      status: "Activo",
      national_skus: "NAT-001 NAT-002",
    });

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-w12-space.xlsx", buffer),
    });

    const json = await response.json();
    expect(
      json.warnings.some(
        (w: any) => w.code === "W12_SPACE_DELIMITED_SKUS"
      )
    ).toBe(true);
  });

  test("warnings do not block import (valid is true)", async ({ request }) => {
    const builder = new TestWorkbookBuilder();
    // Space-delimited SKU triggers W12 but should not block
    builder.addPart({
      acr_sku: "ACR-WVALID-001",
      part_type: "MAZA",
      status: "Activo",
      national_skus: "NAT-001 NAT-002",
    });

    const buffer = await builder.toBuffer();

    const response = await request.post("/api/admin/import/validate", {
      ...fileMultipart("test-warnings-valid.xlsx", buffer),
    });

    const json = await response.json();
    expect(json.warnings.length).toBeGreaterThan(0);
    expect(json.valid).toBe(true);
  });
});

// ============================================================================
// 5. Admin Import -- Error UI Behavior
// ============================================================================

test.describe("Admin Import -- Error UI Behavior", () => {
  // BLOCKED: shadcn Checkbox not found by input[type="checkbox"] locator — needs data-testid
  test.fixme("errors block import in UI; warnings allow with acknowledgment", async ({
    page,
  }) => {
    await page.goto("/admin/import");

    // --- Part A: Upload file with an error (duplicate ACR_SKU) ---

    const errorBuilder = new TestWorkbookBuilder();
    errorBuilder
      .addPart({
        acr_sku: "ACR-UIERR-001",
        part_type: "MAZA",
        status: "Activo",
      })
      .addPart({
        acr_sku: "ACR-UIERR-001",
        part_type: "ROTOR",
        status: "Activo",
      });

    const errorBuffer = await errorBuilder.toBuffer();
    const errorFilePath = writeTmpFile("test-ui-error.xlsx", errorBuffer);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(errorFilePath);

    // Wait for validation results to show (errors displayed on step 1)
    await expect(
      page.getByText(/issue|error|problema/i)
    ).toBeVisible({ timeout: 30_000 });

    // The Execute Import button should not be reachable -- still on step 1
    // with errors displayed, the wizard does not advance to step 2.
    // Verify the execute button is either not visible or disabled.
    const executeButton = page.getByRole("button", {
      name: /execute import|ejecutar/i,
    });
    // It should not be visible since we are blocked on step 1
    await expect(executeButton).not.toBeVisible();

    // --- Part B: Upload a file with only warnings (space-delimited SKUs) ---

    const warningBuilder = new TestWorkbookBuilder();
    warningBuilder.addPart({
      acr_sku: "ACR-UIWARN-001",
      part_type: "MAZA",
      status: "Activo",
      national_skus: "NAT-001 NAT-002",
    });

    const warningBuffer = await warningBuilder.toBuffer();
    const warningFilePath = writeTmpFile("test-ui-warning.xlsx", warningBuffer);

    // Re-upload the corrected file -- the file input should still be in DOM
    // (the "Upload Corrected File" button triggers the same input)
    await fileInput.setInputFiles(warningFilePath);

    // Wait for step 2 (Review) -- warnings don't block advancement
    await expectCurrentStep(page, /review/i, 30_000);

    // The Execute Import button should be visible but disabled until warnings acknowledged
    const execButton = page.getByRole("button", {
      name: /execute import|ejecutar/i,
    });
    await expect(execButton).toBeVisible();
    await expect(execButton).toBeDisabled();

    // Find and check the acknowledgment checkbox
    const acknowledgeCheckbox = page.locator(
      'input[type="checkbox"]'
    );
    // There should be at least one checkbox for acknowledging warnings
    const checkboxCount = await acknowledgeCheckbox.count();
    if (checkboxCount > 0) {
      await acknowledgeCheckbox.first().check();
    }

    // Now the execute button should be enabled
    await expect(execButton).toBeEnabled({ timeout: 5_000 });
  });
});
