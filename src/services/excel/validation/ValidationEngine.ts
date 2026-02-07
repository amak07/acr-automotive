// ============================================================================
// Validation Engine - Validate parsed Excel data
// ============================================================================

import {
  ValidationSeverity,
  ValidationErrorCode,
  ValidationWarningCode,
  ValidationIssue,
  ValidationResult,
} from "./types";
import type {
  ParsedExcelFile,
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelAliasRow,
} from "../shared/types";
import {
  SHEET_NAMES,
  BRAND_COLUMN_MAP,
  IMAGE_VIEW_TYPE_MAP,
  DELETE_MARKER,
  splitCrossRefSkus,
} from "../shared/constants";

// ----------------------------------------------------------------------------
// Validation Configuration
// ----------------------------------------------------------------------------

const MAX_LENGTHS = {
  ACR_SKU: 50,
  PART_TYPE: 100,
  POSITION_TYPE: 50,
  ABS_TYPE: 20,
  BOLT_PATTERN: 50,
  DRIVE_TYPE: 50,
  MAKE: 50,
  MODEL: 100,
  COMPETITOR_BRAND: 50,
  COMPETITOR_SKU: 50,
  IMAGE_URL: 2000,
  BRAND_SKU: 50,
} as const;

const YEAR_RANGE = {
  MIN: 1900,
  MAX: new Date().getFullYear() + 2, // Allow next year's models
} as const;

// Valid Status values for each sheet type
const VALID_PART_STATUS = ["activo", "inactivo", "eliminar"] as const;
const VALID_VA_STATUS = ["activo", "eliminar"] as const;
const VALID_ALIAS_STATUS = ["activo", "eliminar"] as const;

// ----------------------------------------------------------------------------
// Database Data (for comparison)
// ----------------------------------------------------------------------------

/**
 * Existing database data for validation
 *
 * Keys use business identifiers:
 * - parts: keyed by acr_sku
 * - vehicleApplications: keyed by composite "acr_sku::make::model"
 * - crossReferences: keyed by UUID (for brand column diffing)
 * - aliases: keyed by composite "alias::canonical_name"
 */
export interface ExistingDatabaseData {
  parts: Map<string, ExcelPartRow>; // Keyed by acr_sku
  vehicleApplications: Map<string, ExcelVehicleAppRow>; // Keyed by "acr_sku::make::model"
  crossReferences: Map<string, { _id: string; acr_part_id: string; competitor_brand: string; competitor_sku: string }>; // Keyed by UUID
  partSkus: Set<string>; // All existing ACR SKUs
  aliases: Map<string, ExcelAliasRow>; // Keyed by "alias::canonical_name"
}

// ----------------------------------------------------------------------------
// Validation Engine
// ----------------------------------------------------------------------------

export class ValidationEngine {
  private errors: ValidationIssue[] = [];
  private warnings: ValidationIssue[] = [];

  /**
   * Normalize optional field values for comparison
   * Treats null, undefined, and empty string as equivalent
   */
  private normalizeOptional(value: any): string | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    return String(value);
  }

  /**
   * Validate parsed Excel file
   *
   * Format: 2-sheet (Parts + Vehicle Applications) or 3-sheet (+ Vehicle Aliases)
   * - Parts matched by acr_sku
   * - VAs matched by (acr_sku, make, model)
   * - Aliases matched by (alias, canonical_name)
   * - No hidden columns — all matching by business keys
   * - Errors column with Excel formulas blocks import if non-empty (E23)
   *
   * @param parsed - Parsed Excel file
   * @param existingData - Current database data for comparison
   * @returns Validation result with errors and warnings
   */
  async validate(
    parsed: ParsedExcelFile,
    existingData: ExistingDatabaseData
  ): Promise<ValidationResult> {
    this.errors = [];
    this.warnings = [];

    // File-level validations (E10, E13)
    this.validateFileStructure(parsed);

    // Sheet-level validations
    this.validatePartsSheet(parsed.parts.data, existingData);
    this.validateVehicleApplicationsSheet(
      parsed.vehicleApplications.data,
      parsed.parts.data,
      existingData
    );

    // Validate aliases if present
    if (parsed.aliases && parsed.aliases.data.length > 0) {
      this.validateAliasesSheet(parsed.aliases.data, existingData);
    }

    // Generate summary
    const summary = this.generateSummary();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary,
    };
  }

  // --------------------------------------------------------------------------
  // File-Level Validations
  // --------------------------------------------------------------------------

  /**
   * E10: Required sheet missing
   * E13: Invalid sheet name
   */
  private validateFileStructure(parsed: ParsedExcelFile): void {
    // E10: Required sheets present (already validated by parser, but double-check)
    if (
      parsed.parts.rowCount === 0 &&
      parsed.vehicleApplications.rowCount === 0
    ) {
      this.addError(
        ValidationErrorCode.E10_REQUIRED_SHEET_MISSING,
        "All sheets are empty. File must contain data.",
        undefined
      );
    }
  }

  // --------------------------------------------------------------------------
  // Parts Sheet Validations
  // --------------------------------------------------------------------------

  private validatePartsSheet(
    parts: ExcelPartRow[],
    existingData: ExistingDatabaseData
  ): void {
    const skusInFile = new Set<string>();

    parts.forEach((part, index) => {
      const rowNumber = index + 4; // +4 for 3 header rows + 1-index

      // E23: Errors column not empty (Excel formula detected errors)
      if (part.errors && part.errors.toString().trim() !== "") {
        this.addError(
          ValidationErrorCode.E23_ERRORS_COLUMN_NOT_EMPTY,
          `Excel validation error in row ${rowNumber}: ${part.errors}`,
          SHEET_NAMES.PARTS,
          rowNumber,
          "Errors",
          part.errors
        );
      }

      // E3: Empty required fields
      if (
        !part.acr_sku ||
        (typeof part.acr_sku === "string" && part.acr_sku.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "ACR SKU is required",
          SHEET_NAMES.PARTS,
          rowNumber,
          "ACR SKU"
        );
      }

      if (
        !part.part_type ||
        (typeof part.part_type === "string" && part.part_type.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "Part Type is required",
          SHEET_NAMES.PARTS,
          rowNumber,
          "Part Type"
        );
      }

      // E2: Duplicate ACR SKU within file
      if (part.acr_sku) {
        if (skusInFile.has(part.acr_sku)) {
          this.addError(
            ValidationErrorCode.E2_DUPLICATE_ACR_SKU,
            `Duplicate ACR SKU "${part.acr_sku}" found in file`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "ACR SKU",
            part.acr_sku
          );
        }
        skusInFile.add(part.acr_sku);
      }

      // E7: String exceeds max length
      this.validateMaxLength(
        part.acr_sku,
        MAX_LENGTHS.ACR_SKU,
        "ACR SKU",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.part_type,
        MAX_LENGTHS.PART_TYPE,
        "Part Type",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.position_type,
        MAX_LENGTHS.POSITION_TYPE,
        "Position",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.abs_type,
        MAX_LENGTHS.ABS_TYPE,
        "ABS Type",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.bolt_pattern,
        MAX_LENGTHS.BOLT_PATTERN,
        "Bolt Pattern",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.drive_type,
        MAX_LENGTHS.DRIVE_TYPE,
        "Drive Type",
        SHEET_NAMES.PARTS,
        rowNumber
      );

      // E20: ACR SKU must start with "ACR" prefix
      if (
        part.acr_sku &&
        typeof part.acr_sku === "string" &&
        !part.acr_sku.toUpperCase().startsWith("ACR")
      ) {
        this.addError(
          ValidationErrorCode.E20_INVALID_ACR_SKU_FORMAT,
          `ACR SKU must start with "ACR" prefix. Found: "${part.acr_sku}".`,
          SHEET_NAMES.PARTS,
          rowNumber,
          "ACR SKU",
          part.acr_sku
        );
      }

      // Validate Status if present
      if (part.status && part.status.trim() !== "") {
        const statusLower = part.status.trim().toLowerCase();
        if (!VALID_PART_STATUS.includes(statusLower as any)) {
          this.addError(
            ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
            `Invalid Status value: "${part.status}". Must be Activo, Inactivo, or Eliminar.`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "Status",
            part.status
          );
        }
      }

      // Validate brand columns
      this.validateBrandColumns(part, rowNumber);

      // Validate image URL columns
      this.validateImageUrlColumns(part, rowNumber);

      // Warnings: Compare with existing data (matched by acr_sku)
      if (part.acr_sku && existingData.parts.has(part.acr_sku)) {
        const existing = existingData.parts.get(part.acr_sku)!;

        // W3: Part Type changed
        if (existing.part_type !== part.part_type) {
          this.addWarning(
            ValidationWarningCode.W3_PART_TYPE_CHANGED,
            `Part Type changed from "${existing.part_type}" to "${part.part_type}"`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "Part Type",
            part.part_type,
            existing.part_type
          );
        }

        // W4: Position Type changed
        const normalizedExistingPosition = this.normalizeOptional(
          existing.position_type
        );
        const normalizedNewPosition = this.normalizeOptional(
          part.position_type
        );
        if (normalizedExistingPosition !== normalizedNewPosition) {
          this.addWarning(
            ValidationWarningCode.W4_POSITION_TYPE_CHANGED,
            `Position changed from "${existing.position_type}" to "${part.position_type}"`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "Position",
            part.position_type,
            existing.position_type
          );
        }

        // W7: Specifications shortened significantly (>50% reduction)
        if (existing.specifications && part.specifications) {
          const oldLength = existing.specifications.length;
          const newLength = part.specifications.length;
          if (newLength < oldLength * 0.5) {
            this.addWarning(
              ValidationWarningCode.W7_SPECIFICATIONS_SHORTENED,
              `Specifications shortened from ${oldLength} to ${newLength} characters (${Math.round((1 - newLength / oldLength) * 100)}% reduction)`,
              SHEET_NAMES.PARTS,
              rowNumber,
              "Specifications"
            );
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // Vehicle Applications Sheet Validations
  // --------------------------------------------------------------------------

  private validateVehicleApplicationsSheet(
    vehicles: ExcelVehicleAppRow[],
    parts: ExcelPartRow[],
    existingData: ExistingDatabaseData
  ): void {
    // Build ACR SKU set from uploaded file (for acr_sku references)
    const partSkusInFile = new Set(parts.map((p) => p.acr_sku).filter(Boolean));

    // Combine with existing SKUs from database
    const allKnownSkus = new Set([...partSkusInFile, ...existingData.partSkus]);

    vehicles.forEach((vehicle, index) => {
      const rowNumber = index + 4; // +4 for 3 header rows + 1-index

      // E23: Errors column not empty
      if (vehicle.errors && vehicle.errors.toString().trim() !== "") {
        this.addError(
          ValidationErrorCode.E23_ERRORS_COLUMN_NOT_EMPTY,
          `Excel validation error in row ${rowNumber}: ${vehicle.errors}`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "Errors",
          vehicle.errors
        );
      }

      // E3: Empty required fields
      if (
        !vehicle.acr_sku ||
        (typeof vehicle.acr_sku === "string" && vehicle.acr_sku.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "ACR SKU is required",
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "ACR SKU"
        );
      }

      if (
        !vehicle.make ||
        (typeof vehicle.make === "string" && vehicle.make.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "Make is required",
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "Make"
        );
      }

      if (
        !vehicle.model ||
        (typeof vehicle.model === "string" && vehicle.model.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "Model is required",
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "Model"
        );
      }

      // E5: Orphaned foreign key (ACR SKU must reference a part in file or database)
      if (vehicle.acr_sku && !allKnownSkus.has(vehicle.acr_sku)) {
        this.addError(
          ValidationErrorCode.E5_ORPHANED_FOREIGN_KEY,
          `ACR SKU "${vehicle.acr_sku}" does not reference any existing part`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "ACR SKU",
          vehicle.acr_sku
        );
      }

      // E6: Invalid year range
      const startYear = typeof vehicle.start_year === 'string' ? parseInt(vehicle.start_year) : vehicle.start_year;
      const endYear = typeof vehicle.end_year === 'string' ? parseInt(vehicle.end_year) : vehicle.end_year;

      if (
        startYear &&
        endYear &&
        endYear < startYear
      ) {
        this.addError(
          ValidationErrorCode.E6_INVALID_YEAR_RANGE,
          `End Year (${endYear}) cannot be before Start Year (${startYear})`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "End Year"
        );
      }

      // E8: Year out of range
      if (
        startYear &&
        (startYear < YEAR_RANGE.MIN || startYear > YEAR_RANGE.MAX)
      ) {
        this.addError(
          ValidationErrorCode.E8_YEAR_OUT_OF_RANGE,
          `Start Year ${startYear} is out of valid range (${YEAR_RANGE.MIN}-${YEAR_RANGE.MAX})`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "Start Year",
          startYear
        );
      }

      if (
        endYear &&
        (endYear < YEAR_RANGE.MIN || endYear > YEAR_RANGE.MAX)
      ) {
        this.addError(
          ValidationErrorCode.E8_YEAR_OUT_OF_RANGE,
          `End Year ${endYear} is out of valid range (${YEAR_RANGE.MIN}-${YEAR_RANGE.MAX})`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "End Year",
          endYear
        );
      }

      // E9: Invalid number format (years must be integers)
      if (startYear && !Number.isInteger(startYear)) {
        this.addError(
          ValidationErrorCode.E9_INVALID_NUMBER_FORMAT,
          `Start Year must be an integer, got: ${vehicle.start_year}`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "Start Year",
          vehicle.start_year
        );
      }

      if (endYear && !Number.isInteger(endYear)) {
        this.addError(
          ValidationErrorCode.E9_INVALID_NUMBER_FORMAT,
          `End Year must be an integer, got: ${vehicle.end_year}`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "End Year",
          vehicle.end_year
        );
      }

      // E7: String exceeds max length
      this.validateMaxLength(
        vehicle.make,
        MAX_LENGTHS.MAKE,
        "Make",
        SHEET_NAMES.VEHICLE_APPLICATIONS,
        rowNumber
      );
      this.validateMaxLength(
        vehicle.model,
        MAX_LENGTHS.MODEL,
        "Model",
        SHEET_NAMES.VEHICLE_APPLICATIONS,
        rowNumber
      );

      // Validate Status if present
      if (vehicle.status && vehicle.status.trim() !== "") {
        const statusLower = vehicle.status.trim().toLowerCase();
        if (!VALID_VA_STATUS.includes(statusLower as any)) {
          this.addError(
            ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
            `Invalid Status value: "${vehicle.status}". Must be Activo or Eliminar.`,
            SHEET_NAMES.VEHICLE_APPLICATIONS,
            rowNumber,
            "Status",
            vehicle.status
          );
        }
      }

      // Warnings: Compare with existing data (matched by composite key)
      const compositeKey = `${vehicle.acr_sku}::${vehicle.make}::${vehicle.model}::${vehicle.start_year}`;
      if (existingData.vehicleApplications.has(compositeKey)) {
        const existing = existingData.vehicleApplications.get(compositeKey)!;

        // W2: Year range narrowed
        const existingStartYear = typeof existing.start_year === 'string' ? parseInt(existing.start_year) : existing.start_year;
        const existingEndYear = typeof existing.end_year === 'string' ? parseInt(existing.end_year) : existing.end_year;
        if (
          existingStartYear < startYear ||
          existingEndYear > endYear
        ) {
          this.addWarning(
            ValidationWarningCode.W2_YEAR_RANGE_NARROWED,
            `Year range narrowed from ${existing.start_year}-${existing.end_year} to ${startYear}-${endYear}`,
            SHEET_NAMES.VEHICLE_APPLICATIONS,
            rowNumber,
            "Start Year / End Year"
          );
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // Vehicle Aliases Sheet Validations
  // --------------------------------------------------------------------------

  private validateAliasesSheet(
    aliases: ExcelAliasRow[],
    existingData: ExistingDatabaseData
  ): void {
    aliases.forEach((alias, index) => {
      const rowNumber = index + 4; // +4 for 3 header rows + 1-index

      // E23: Errors column not empty
      if (alias.errors && alias.errors.toString().trim() !== "") {
        this.addError(
          ValidationErrorCode.E23_ERRORS_COLUMN_NOT_EMPTY,
          `Excel validation error in row ${rowNumber}: ${alias.errors}`,
          SHEET_NAMES.ALIASES,
          rowNumber,
          "Errors",
          alias.errors
        );
      }

      // E3: Empty required fields
      if (!alias.alias || alias.alias.trim() === "") {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "Alias is required",
          SHEET_NAMES.ALIASES,
          rowNumber,
          "Alias"
        );
      }

      if (!alias.canonical_name || alias.canonical_name.trim() === "") {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "Canonical Name is required",
          SHEET_NAMES.ALIASES,
          rowNumber,
          "Canonical Name"
        );
      }

      if (!alias.alias_type || alias.alias_type.trim() === "") {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "Type is required",
          SHEET_NAMES.ALIASES,
          rowNumber,
          "Type"
        );
      }

      // Validate Status if present
      if (alias.status && alias.status.trim() !== "") {
        const statusLower = alias.status.trim().toLowerCase();
        if (!VALID_ALIAS_STATUS.includes(statusLower as any)) {
          this.addError(
            ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
            `Invalid Status value: "${alias.status}". Must be Activo or Eliminar.`,
            SHEET_NAMES.ALIASES,
            rowNumber,
            "Status",
            alias.status
          );
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private validateMaxLength(
    value: string | undefined,
    maxLength: number,
    columnName: string,
    sheetName: string,
    rowNumber: number
  ): void {
    if (value && value.length > maxLength) {
      this.addError(
        ValidationErrorCode.E7_STRING_EXCEEDS_MAX_LENGTH,
        `${columnName} exceeds maximum length of ${maxLength} characters (got ${value.length})`,
        sheetName,
        rowNumber,
        columnName,
        value
      );
    }
  }

  // --------------------------------------------------------------------------
  // Brand Column Validations
  // --------------------------------------------------------------------------

  /**
   * Validate brand columns (semicolon-separated SKUs)
   * - Each SKU max 50 chars
   * - [DELETE] marker allowed as prefix
   * - Warn on duplicate SKUs within same brand column
   * - Warn on legacy space-delimited format (auto-converted)
   */
  private validateBrandColumns(part: ExcelPartRow, rowNumber: number): void {
    for (const [propName, brandName] of Object.entries(BRAND_COLUMN_MAP)) {
      const columnValue = part[propName as keyof ExcelPartRow] as
        | string
        | undefined;

      if (!columnValue || columnValue.trim() === "") {
        continue; // Empty is valid (no change to existing)
      }

      // Use shared helper to split on semicolon or space (legacy)
      const { skus, hadSpaceDelimiters } = splitCrossRefSkus(columnValue);

      // Warn if legacy space delimiters were detected
      if (hadSpaceDelimiters) {
        this.addWarning(
          ValidationWarningCode.W12_SPACE_DELIMITED_SKUS,
          `${brandName} column uses space-delimited SKUs (legacy format). Will be normalized to semicolon-delimited on import.`,
          SHEET_NAMES.PARTS,
          rowNumber,
          propName,
          columnValue
        );
      }

      const seenSkus = new Set<string>();

      for (const sku of skus) {
        // Extract actual SKU (remove [DELETE] marker if present)
        let actualSku = sku;
        if (sku.startsWith(DELETE_MARKER)) {
          actualSku = sku.substring(DELETE_MARKER.length).trim();
        }

        // Validate SKU length
        if (actualSku.length > MAX_LENGTHS.BRAND_SKU) {
          this.addError(
            ValidationErrorCode.E7_STRING_EXCEEDS_MAX_LENGTH,
            `SKU "${actualSku}" in ${brandName} column exceeds max length of ${MAX_LENGTHS.BRAND_SKU} chars`,
            SHEET_NAMES.PARTS,
            rowNumber,
            propName,
            actualSku
          );
        }

        // Validate SKU not empty after removing marker
        if (actualSku === "") {
          this.addError(
            ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
            `Empty SKU found in ${brandName} column (possibly after [DELETE] marker)`,
            SHEET_NAMES.PARTS,
            rowNumber,
            propName
          );
        }

        // Check for duplicates within same column (warning only)
        const normalizedSku = actualSku.toUpperCase();
        if (seenSkus.has(normalizedSku)) {
          this.addWarning(
            ValidationWarningCode.W11_DUPLICATE_SKU_IN_BRAND,
            `Duplicate SKU "${actualSku}" in ${brandName} column`,
            SHEET_NAMES.PARTS,
            rowNumber,
            propName,
            actualSku
          );
        }
        seenSkus.add(normalizedSku);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Image URL Validations
  // --------------------------------------------------------------------------

  /**
   * Validate image URL columns
   * - Must be valid URL format (https:// preferred)
   * - Max 2000 chars
   */
  private validateImageUrlColumns(part: ExcelPartRow, rowNumber: number): void {
    for (const [propName, viewType] of Object.entries(IMAGE_VIEW_TYPE_MAP)) {
      const url = part[propName as keyof ExcelPartRow] as string | undefined;

      if (!url || url.trim() === "") {
        continue; // Empty is valid (no change to existing)
      }

      const trimmedUrl = url.trim();

      // Validate URL length
      if (trimmedUrl.length > MAX_LENGTHS.IMAGE_URL) {
        this.addError(
          ValidationErrorCode.E7_STRING_EXCEEDS_MAX_LENGTH,
          `Image URL for ${viewType} exceeds max length of ${MAX_LENGTHS.IMAGE_URL} chars`,
          SHEET_NAMES.PARTS,
          rowNumber,
          propName,
          trimmedUrl
        );
      }

      // Validate URL format (must start with http:// or https://)
      if (
        !trimmedUrl.startsWith("http://") &&
        !trimmedUrl.startsWith("https://")
      ) {
        this.addError(
          ValidationErrorCode.E22_INVALID_URL_FORMAT,
          `Invalid image URL format for ${viewType}. Must start with http:// or https://`,
          SHEET_NAMES.PARTS,
          rowNumber,
          propName,
          trimmedUrl
        );
      }
    }
  }

  private addError(
    code: ValidationErrorCode,
    message: string,
    sheet?: string,
    row?: number,
    column?: string,
    value?: any
  ): void {
    this.errors.push({
      code,
      severity: ValidationSeverity.ERROR,
      message,
      sheet,
      row,
      column,
      value,
    });
  }

  private addWarning(
    code: ValidationWarningCode,
    message: string,
    sheet?: string,
    row?: number,
    column?: string,
    value?: any,
    expected?: any
  ): void {
    this.warnings.push({
      code,
      severity: ValidationSeverity.WARNING,
      message,
      sheet,
      row,
      column,
      value,
      expected,
    });
  }

  private generateSummary() {
    const errorsBySheet: Record<string, number> = {};
    const warningsBySheet: Record<string, number> = {};

    this.errors.forEach((error) => {
      const sheet = error.sheet || "General";
      errorsBySheet[sheet] = (errorsBySheet[sheet] || 0) + 1;
    });

    this.warnings.forEach((warning) => {
      const sheet = warning.sheet || "General";
      warningsBySheet[sheet] = (warningsBySheet[sheet] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errorsBySheet,
      warningsBySheet,
    };
  }
}
