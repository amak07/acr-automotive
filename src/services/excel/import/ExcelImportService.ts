// ============================================================================
// Excel Import Service - Parse uploaded Excel files
// ============================================================================

import ExcelJS from "exceljs";
import {
  SHEET_NAMES,
  FILE_VALIDATION,
  headerToPropertyName,
} from "../shared/constants";
import type {
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelAliasRow,
  ParsedExcelFile,
} from "../shared/types";

// ----------------------------------------------------------------------------
// Excel Parser
// ----------------------------------------------------------------------------

export class ExcelImportService {
  /**
   * Parse uploaded Excel file using ExcelJS
   *
   * @param file - Uploaded Excel file
   * @returns Parsed file structure with Parts, Vehicle Applications, and optionally Aliases
   */
  async parseFile(file: File): Promise<ParsedExcelFile> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // Validate required sheets
      const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS);
      const vehicleAppsSheet = workbook.getWorksheet(
        SHEET_NAMES.VEHICLE_APPLICATIONS
      );
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
      const aliasesData = aliasesSheet
        ? this.parseSheet<ExcelAliasRow>(aliasesSheet)
        : [];

      const result: ParsedExcelFile = {
        parts: {
          sheetName: SHEET_NAMES.PARTS,
          data: partsData,
          rowCount: partsData.length,
        },
        vehicleApplications: {
          sheetName: SHEET_NAMES.VEHICLE_APPLICATIONS,
          data: vehicleAppsData,
          rowCount: vehicleAppsData.length,
        },
        metadata: {
          uploadedAt: new Date(),
          fileName: file.name,
          fileSize: file.size,
        },
      };

      if (aliasesSheet) {
        result.aliases = {
          sheetName: SHEET_NAMES.ALIASES,
          data: aliasesData,
          rowCount: aliasesData.length,
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
   *
   * Maps Excel column headers to object properties using headerToPropertyName().
   * Supports 2-row (group + column headers) and 3-row (+ instructions) formats.
   */
  private parseSheet<T>(worksheet: ExcelJS.Worksheet): T[] {
    const rows: T[] = [];

    const { headerRowNumber, dataStartRow } =
      this.detectHeaderFormat(worksheet);

    // Build header map: column number → property name
    const headerRow = worksheet.getRow(headerRowNumber);
    const headerMap: Map<number, string> = new Map();

    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = this.getCellText(cell.value);
      if (header) {
        const propertyName = headerToPropertyName(header);
        headerMap.set(colNumber, propertyName);
      }
    });

    // Parse data rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < dataStartRow) return;

      const rowData: any = {};
      let hasData = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const propertyName = headerMap.get(colNumber);
        if (!propertyName) return;

        // Skip the errors column — it's formula-driven and read-only
        if (propertyName === "errors") {
          // Read formula result for validation (E23 check)
          const result = cell.result;
          if (result && typeof result === "string" && result.trim() !== "") {
            rowData[propertyName] = result.trim();
            hasData = true;
          }
          return;
        }

        let value = cell.value;

        // Handle ExcelJS hyperlink cells — extract the URL
        if (value && typeof value === "object" && "hyperlink" in value) {
          value = (value as ExcelJS.CellHyperlinkValue).hyperlink;
        }

        // Handle ExcelJS formula cells — use the computed result
        if (value && typeof value === "object" && "formula" in value) {
          value = (value as any).result;
        }

        // Handle ExcelJS date values
        if (value instanceof Date) {
          value = value.toISOString();
        }

        if (typeof value === "number") {
          rowData[propertyName] = value;
          hasData = true;
        } else if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed) {
            rowData[propertyName] = trimmed;
            hasData = true;
          }
        } else if (typeof value === "boolean") {
          rowData[propertyName] = value;
          hasData = true;
        }
        // null/undefined → skip
        else if (value !== null && value !== undefined) {
          const stringValue = String(value).trim();
          if (stringValue) {
            rowData[propertyName] = stringValue;
            hasData = true;
          }
        }
      });

      if (hasData) {
        rows.push(rowData as T);
      }
    });

    return rows;
  }

  /** Extract display text from ExcelJS cell value (handles hyperlinks, formulas, plain values) */
  private getCellText(value: ExcelJS.CellValue): string {
    if (!value) return "";
    if (typeof value === "object") {
      if ("text" in value)
        return String((value as ExcelJS.CellHyperlinkValue).text || "");
      if ("formula" in value) return String((value as any).result || "");
    }
    return String(value);
  }

  /**
   * Detect worksheet header format to determine where data starts
   *
   * Supports 2 formats:
   * 1. Styled (2-row header): Group headers Row 1, column headers Row 2, data Row 3+
   * 2. Full (3-row header): Group headers Row 1, column headers Row 2, instructions Row 3, data Row 4+
   *
   * @returns { headerRowNumber, dataStartRow }
   */
  private detectHeaderFormat(worksheet: ExcelJS.Worksheet): {
    headerRowNumber: number;
    dataStartRow: number;
  } {
    const row2 = worksheet.getRow(2);
    const row3 = worksheet.getRow(3);

    // Check Row 2 for column header characteristics
    let row2HasColumnHeaders = false;
    row2.eachCell({ includeEmpty: false }, (cell) => {
      const value = this.getCellText(cell.value);
      if (
        /^[A-Z][a-z]*[_ ]/.test(value) ||
        value === "Make" ||
        value === "Model" ||
        value === "Alias" ||
        value === "Type" ||
        value === "Status" ||
        value === "Errors"
      ) {
        row2HasColumnHeaders = true;
      }
    });

    // Check Row 3 for instruction-like content
    let row3HasInstructions = false;
    row3.eachCell({ includeEmpty: false }, (cell) => {
      const value = this.getCellText(cell.value);
      if (
        value.includes("separate with") ||
        value.includes("separar con") ||
        value.includes("Do not") ||
        value.includes("No modificar") ||
        value.includes("Upload via") ||
        value.includes("Subir en") ||
        value.includes("e.g.,") ||
        value.includes("ej.,") ||
        value.includes("Nickname or alternate") ||
        value.includes("Official name to map") ||
        value.includes("make or model") ||
        value.includes("Apodo o nombre") ||
        value.includes("Nombre oficial a mapear") ||
        value.includes("make o model") ||
        value.includes("Activo") ||
        value.includes("auto formula") ||
        value.includes("fórmula automática")
      ) {
        row3HasInstructions = true;
      }
    });

    if (row2HasColumnHeaders && row3HasInstructions) {
      return { headerRowNumber: 2, dataStartRow: 4 };
    } else if (row2HasColumnHeaders) {
      return { headerRowNumber: 2, dataStartRow: 3 };
    } else {
      // Fallback: assume headers in row 1
      return { headerRowNumber: 1, dataStartRow: 2 };
    }
  }

  /**
   * Validate file format before parsing
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

    if (file.size > FILE_VALIDATION.MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File size exceeds limit. Maximum ${FILE_VALIDATION.MAX_FILE_SIZE_MB} MB, got: ${Math.round(file.size / 1024 / 1024)} MB`
      );
    }

    if (
      file.type &&
      !FILE_VALIDATION.VALID_MIME_TYPES.includes(file.type as any)
    ) {
      console.warn(
        `[ExcelImportService] Unexpected MIME type: ${file.type}. Proceeding with parse attempt.`
      );
    }
  }
}
