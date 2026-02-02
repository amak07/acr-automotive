// ============================================================================
// Excel Import Service - Parse uploaded files with hidden ID columns
// ============================================================================

import ExcelJS from "exceljs";
import {
  SHEET_NAMES,
  HIDDEN_ID_COLUMNS,
  FILE_VALIDATION,
  headerToPropertyName,
} from "../shared/constants";
import type {
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelCrossRefRow,
  ExcelAliasRow,
  ParsedSheet,
  ParsedExcelFile,
} from "../shared/types";

// ----------------------------------------------------------------------------
// Excel Parser
// ----------------------------------------------------------------------------

export class ExcelImportService {
  /**
   * Parse uploaded Excel file using ExcelJS
   * Handles hidden columns, multi-sheet format, and error recovery
   *
   * @param file - Uploaded Excel file
   * @returns Parsed file structure with all 3 sheets
   */
  async parseFile(file: File): Promise<ParsedExcelFile> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // Validate sheet structure (using shared constants)
      const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS);
      const vehicleAppsSheet = workbook.getWorksheet(
        SHEET_NAMES.VEHICLE_APPLICATIONS
      );
      // Cross References sheet is optional (Phase 3 uses brand columns in Parts sheet)
      const crossRefsSheet = workbook.getWorksheet(
        SHEET_NAMES.CROSS_REFERENCES
      );
      // Aliases sheet is optional (Phase 4A)
      const aliasesSheet = workbook.getWorksheet(SHEET_NAMES.ALIASES);

      if (!partsSheet) {
        throw new Error(`Missing required sheet: ${SHEET_NAMES.PARTS}`);
      }
      if (!vehicleAppsSheet) {
        throw new Error(
          `Missing required sheet: ${SHEET_NAMES.VEHICLE_APPLICATIONS}`
        );
      }

      // Parse each sheet
      const partsData = this.parseSheet<ExcelPartRow>(partsSheet);
      const vehicleAppsData =
        this.parseSheet<ExcelVehicleAppRow>(vehicleAppsSheet);
      // Cross-refs optional - returns empty array if sheet missing
      const crossRefsData = crossRefsSheet
        ? this.parseSheet<ExcelCrossRefRow>(crossRefsSheet)
        : [];
      // Aliases optional - parse if present
      const aliasesData = aliasesSheet
        ? this.parseSheet<ExcelAliasRow>(aliasesSheet)
        : [];

      // Check for hidden ID columns
      const hasHiddenIds = this.detectHiddenColumns(partsSheet);

      const result: ParsedExcelFile = {
        parts: {
          sheetName: SHEET_NAMES.PARTS,
          data: partsData,
          rowCount: partsData.length,
          hasHiddenIds,
        },
        vehicleApplications: {
          sheetName: SHEET_NAMES.VEHICLE_APPLICATIONS,
          data: vehicleAppsData,
          rowCount: vehicleAppsData.length,
          hasHiddenIds,
        },
        crossReferences: {
          sheetName: SHEET_NAMES.CROSS_REFERENCES,
          data: crossRefsData,
          rowCount: crossRefsData.length,
          hasHiddenIds,
        },
        metadata: {
          uploadedAt: new Date(),
          fileName: file.name,
          fileSize: file.size,
        },
      };

      // Add aliases if sheet was present
      if (aliasesSheet) {
        result.aliases = {
          sheetName: SHEET_NAMES.ALIASES,
          data: aliasesData,
          rowCount: aliasesData.length,
          hasHiddenIds,
        };
      }

      return result;
    } catch (error) {
      console.error("[ExcelImportService] Parse error:", error);
      throw new Error(
        `Failed to parse Excel file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Parse worksheet to array of objects
   * Handles hidden columns and type conversion
   *
   * Maps Excel column headers to object properties using shared headerToPropertyName():
   * - "_id" → "_id"
   * - "ACR_SKU" → "acr_sku"
   * - "Part_Type" → "part_type"
   * - etc.
   */
  private parseSheet<T>(worksheet: ExcelJS.Worksheet): T[] {
    const rows: T[] = [];

    // Get header row (row 1)
    // IMPORTANT: Use includeEmpty: true to include hidden columns
    const headerRow = worksheet.getRow(1);
    const headerMap: Map<number, string> = new Map();

    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = cell.value?.toString() || "";
      if (header) {
        // Convert header to snake_case property name using shared function
        const propertyName = headerToPropertyName(header);
        headerMap.set(colNumber, propertyName);
      }
    });

    // Parse data rows (starting from row 2)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowData: any = {};
      let hasData = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const propertyName = headerMap.get(colNumber);
        if (!propertyName) return;

        // Convert cell value to appropriate type
        let value = cell.value;

        // Handle ExcelJS date values
        if (value instanceof Date) {
          value = value.toISOString();
        }

        // Handle numeric values
        if (typeof value === "number") {
          rowData[propertyName] = value;
          hasData = true;
        }
        // Handle string values (trim whitespace)
        else if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed) {
            rowData[propertyName] = trimmed;
            hasData = true;
          }
        }
        // Handle boolean values
        else if (typeof value === "boolean") {
          rowData[propertyName] = value;
          hasData = true;
        }
        // Handle null/undefined (leave as undefined)
        else if (value === null || value === undefined) {
          // Don't add to object
        }
        // Handle other types (convert to string)
        else {
          const stringValue = String(value).trim();
          if (stringValue) {
            rowData[propertyName] = stringValue;
            hasData = true;
          }
        }
      });

      // Only add row if it has data
      if (hasData) {
        rows.push(rowData as T);
      }
    });

    return rows;
  }

  /**
   * Detect if file has hidden ID columns (_id, _part_id, _acr_part_id)
   * Checks for hidden columns in first worksheet
   *
   * This enforces the "export-only" workflow - users must export first
   * to get IDs before re-importing.
   */
  private detectHiddenColumns(worksheet: ExcelJS.Worksheet): boolean {
    const headerRow = worksheet.getRow(1);
    let hasHiddenIds = false;

    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = cell.value?.toString() || "";
      const column = worksheet.getColumn(colNumber);

      // Check if column is both an ID column AND hidden (using shared constant)
      if (HIDDEN_ID_COLUMNS.includes(header as any) && column.hidden) {
        hasHiddenIds = true;
      }
    });

    return hasHiddenIds;
  }

  /**
   * Validate file format before parsing
   * Checks file extension and MIME type using shared constants
   */
  validateFileFormat(file: File): void {
    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!FILE_VALIDATION.VALID_EXTENSIONS.includes(extension as any)) {
      throw new Error(
        `Invalid file format. Expected Excel file (${FILE_VALIDATION.VALID_EXTENSIONS.join(", ")}), got: ${extension}`
      );
    }

    // Check file size
    if (file.size > FILE_VALIDATION.MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File size exceeds limit. Maximum ${FILE_VALIDATION.MAX_FILE_SIZE_MB} MB, got: ${Math.round(file.size / 1024 / 1024)} MB`
      );
    }

    // Note: MIME type check can be unreliable (user can rename .csv to .xlsx)
    // We rely primarily on extension and ExcelJS parsing
    if (
      file.type &&
      !FILE_VALIDATION.VALID_MIME_TYPES.includes(file.type as any)
    ) {
      console.warn(
        `[ExcelImportService] Unexpected MIME type: ${file.type}. Proceeding with parse attempt.`
      );
    }
  }

  /**
   * Check if file was exported from this system (has hidden IDs)
   * Enforces export-only workflow
   *
   * @returns true if file has hidden ID columns (exported from system)
   */
  isExportedFile(parsed: ParsedExcelFile): boolean {
    return parsed.parts.hasHiddenIds;
  }
}
