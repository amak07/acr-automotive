import ExcelJS from "exceljs";
import {
  SHEET_NAMES,
  COLUMN_HEADERS,
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  ALIASES_COLUMNS,
  PARTS_COLUMN_GROUPS,
  VEHICLE_APPS_COLUMN_GROUPS,
  ALIASES_COLUMN_GROUPS,
  ROW_HEIGHTS,
  addGroupHeaderRow,
  addColumnHeaderRow,
  addInstructionsRow,
  PARTS_INSTRUCTIONS,
  VEHICLE_APPS_INSTRUCTIONS,
  ALIASES_INSTRUCTIONS,
} from "../../../src/services/excel/shared";

// Re-export for test convenience
export { SHEET_NAMES, COLUMN_HEADERS };

/**
 * Data for adding a part row.
 * Only acr_sku and part_type are required; everything else is optional.
 */
export interface PartData {
  acr_sku: string;
  status?: string;
  part_type: string;
  position_type?: string;
  abs_type?: string;
  bolt_pattern?: string;
  drive_type?: string;
  specifications?: string;
  // Brand cross-refs (semicolon-separated)
  national_skus?: string;
  atv_skus?: string;
  syd_skus?: string;
  tmk_skus?: string;
  grob_skus?: string;
  race_skus?: string;
  oem_skus?: string;
  oem_2_skus?: string;
  gmb_skus?: string;
  gsp_skus?: string;
  fag_skus?: string;
  // Image URLs
  image_url_front?: string;
  image_url_back?: string;
  image_url_top?: string;
  image_url_other?: string;
  viewer_360_status?: string;
}

export interface VehicleAppData {
  acr_sku: string;
  status?: string;
  make: string;
  model: string;
  start_year: number;
  end_year: number;
}

export interface AliasData {
  alias: string;
  canonical_name: string;
  alias_type: "make" | "model";
  status?: string;
}

/**
 * Programmatic Excel workbook builder for E2E tests.
 *
 * Generates workbooks that exactly match the ACR export template format
 * (3-row header: group headers, column headers, instructions).
 * Imports column definitions from the shared constants (single source of truth).
 *
 * Usage:
 * ```ts
 * const builder = new TestWorkbookBuilder();
 * builder
 *   .addPart({ acr_sku: 'ACR-TEST-001', part_type: 'Brake Rotor', status: 'Activo' })
 *   .addVehicleApp({ acr_sku: 'ACR-TEST-001', make: 'Toyota', model: 'Camry', start_year: 2020, end_year: 2024 })
 *   .addAlias({ alias: 'camry', canonical_name: 'Toyota Camry', alias_type: 'model' });
 *
 * const buffer = await builder.toBuffer();
 * ```
 */
export class TestWorkbookBuilder {
  private parts: PartData[] = [];
  private vehicleApps: VehicleAppData[] = [];
  private aliases: AliasData[] = [];

  // -- Fluent builders -------------------------------------------------------

  addPart(data: PartData): this {
    this.parts.push(data);
    return this;
  }

  addPartWithCrossRefs(
    data: PartData,
    crossRefs: Record<string, string[]>
  ): this {
    const merged = { ...data };
    for (const [brand, skus] of Object.entries(crossRefs)) {
      const key = `${brand.toLowerCase()}_skus` as keyof PartData;
      (merged as any)[key] = skus.join(";");
    }
    this.parts.push(merged);
    return this;
  }

  addVehicleApp(data: VehicleAppData): this {
    this.vehicleApps.push(data);
    return this;
  }

  addAlias(data: AliasData): this {
    this.aliases.push(data);
    return this;
  }

  /** Set the Status column on a previously added part (0-indexed). */
  setPartStatus(rowIndex: number, status: string): this {
    if (this.parts[rowIndex]) {
      this.parts[rowIndex].status = status;
    }
    return this;
  }


  // -- Output ----------------------------------------------------------------

  /** Build the workbook and return as Buffer. */
  async toBuffer(): Promise<Buffer> {
    const workbook = this.buildWorkbook();
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /** Build the workbook, write to disk, return the path. */
  async toFile(filePath: string): Promise<string> {
    const workbook = this.buildWorkbook();
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  // -- Internal build --------------------------------------------------------

  private buildWorkbook(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ACR Test WorkbookBuilder";
    workbook.created = new Date();

    this.buildPartsSheet(workbook);
    this.buildVehicleAppsSheet(workbook);
    if (this.aliases.length > 0) {
      this.buildAliasesSheet(workbook);
    }

    return workbook;
  }

  private buildPartsSheet(workbook: ExcelJS.Workbook): void {
    const ws = workbook.addWorksheet(SHEET_NAMES.PARTS);

    // Set column definitions (keys, widths)
    ws.columns = PARTS_COLUMNS.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    // Row 1: Group headers (merged)
    addGroupHeaderRow(ws, PARTS_COLUMNS, PARTS_COLUMN_GROUPS);

    // Row 2: Column headers
    addColumnHeaderRow(ws, PARTS_COLUMNS);

    // Row 3: Instructions (English)
    addInstructionsRow(ws, PARTS_COLUMNS, PARTS_INSTRUCTIONS.en);

    // Row 4+: Data
    for (const part of this.parts) {
      const rowValues: Record<string, any> = {};
      for (const col of PARTS_COLUMNS) {
        const value = (part as any)[col.key];
        if (value !== undefined) {
          rowValues[col.key] = value;
        }
      }
      ws.addRow(rowValues);
    }
  }

  private buildVehicleAppsSheet(workbook: ExcelJS.Workbook): void {
    const ws = workbook.addWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS);

    ws.columns = VEHICLE_APPLICATIONS_COLUMNS.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    addGroupHeaderRow(ws, VEHICLE_APPLICATIONS_COLUMNS, VEHICLE_APPS_COLUMN_GROUPS);
    addColumnHeaderRow(ws, VEHICLE_APPLICATIONS_COLUMNS);
    addInstructionsRow(ws, VEHICLE_APPLICATIONS_COLUMNS, VEHICLE_APPS_INSTRUCTIONS.en);

    for (const app of this.vehicleApps) {
      const rowValues: Record<string, any> = {};
      for (const col of VEHICLE_APPLICATIONS_COLUMNS) {
        const value = (app as any)[col.key];
        if (value !== undefined) {
          rowValues[col.key] = value;
        }
      }
      ws.addRow(rowValues);
    }
  }

  private buildAliasesSheet(workbook: ExcelJS.Workbook): void {
    const ws = workbook.addWorksheet(SHEET_NAMES.ALIASES);

    ws.columns = ALIASES_COLUMNS.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    addGroupHeaderRow(ws, ALIASES_COLUMNS, ALIASES_COLUMN_GROUPS);
    addColumnHeaderRow(ws, ALIASES_COLUMNS);
    addInstructionsRow(ws, ALIASES_COLUMNS, ALIASES_INSTRUCTIONS.en);

    for (const alias of this.aliases) {
      const rowValues: Record<string, any> = {};
      for (const col of ALIASES_COLUMNS) {
        const value = (alias as any)[col.key];
        if (value !== undefined) {
          rowValues[col.key] = value;
        }
      }
      ws.addRow(rowValues);
    }
  }
}
