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
  ExcelCrossRefRow,
} from "../shared/types";
import {
  SHEET_NAMES,
  HIDDEN_ID_COLUMNS,
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
  // Phase 3: Image URLs and brand column SKUs
  IMAGE_URL: 2000,
  BRAND_SKU: 50, // Individual SKU within brand column
} as const;

/**
 * Valid values for the _action column (Part deletion)
 */
const VALID_ACTION_VALUES = ["DELETE", ""] as const;

const YEAR_RANGE = {
  MIN: 1900,
  MAX: new Date().getFullYear() + 2, // Allow next year's models
} as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ----------------------------------------------------------------------------
// Database Data (for comparison)
// ----------------------------------------------------------------------------

/**
 * Existing database data for validation
 * This would be fetched from Supabase before validation
 */
export interface ExistingDatabaseData {
  parts: Map<string, ExcelPartRow>; // Keyed by _id
  vehicleApplications: Map<string, ExcelVehicleAppRow>; // Keyed by _id
  crossReferences: Map<string, ExcelCrossRefRow>; // Keyed by _id
  partSkus: Set<string>; // All existing ACR SKUs
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
   * Phase 3 Format:
   * - 2-sheet format: Parts (with brand columns + image URLs), Vehicle Applications
   * - Cross-references are inline in Parts sheet as brand columns (National_SKUs, etc.)
   * - Old 3-sheet files (with separate Cross References sheet) are not supported
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

    // File-level validations (E1, E10, E13)
    this.validateFileStructure(parsed);

    // Sheet-level validations
    this.validatePartsSheet(parsed.parts.data, existingData);
    this.validateVehicleApplicationsSheet(
      parsed.vehicleApplications.data,
      parsed.parts.data,
      existingData
    );

    // Phase 3: Cross-references are now in Parts sheet brand columns
    // If old 3-sheet file with separate Cross References sheet is detected, warn
    if (parsed.crossReferences.rowCount > 0) {
      this.addWarning(
        ValidationWarningCode.W5_CROSS_REFERENCE_DELETED,
        `Found ${parsed.crossReferences.rowCount} rows in deprecated Cross References sheet. ` +
          `Cross-references should now be in Parts sheet brand columns (National_SKUs, ATV_SKUs, etc.). ` +
          `Please re-export from the system to get the new format.`,
        SHEET_NAMES.CROSS_REFERENCES
      );
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
   * E1: Missing hidden ID columns
   * E10: Required sheet missing
   * E13: Invalid sheet name
   */
  private validateFileStructure(parsed: ParsedExcelFile): void {
    // E1: Check for hidden ID columns
    if (!parsed.parts.hasHiddenIds) {
      this.addError(
        ValidationErrorCode.E1_MISSING_HIDDEN_COLUMNS,
        "File does not contain hidden ID columns. Please export from the system first before importing.",
        SHEET_NAMES.PARTS
      );
    }

    // E10: Required sheets present (already validated by parser, but double-check)
    if (
      parsed.parts.rowCount === 0 &&
      parsed.vehicleApplications.rowCount === 0 &&
      parsed.crossReferences.rowCount === 0
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
      const rowNumber = index + 2; // +2 for header and 0-index

      // E3: Empty required fields
      if (
        !part.acr_sku ||
        (typeof part.acr_sku === "string" && part.acr_sku.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "ACR_SKU is required",
          SHEET_NAMES.PARTS,
          rowNumber,
          "ACR_SKU"
        );
      }

      if (
        !part.part_type ||
        (typeof part.part_type === "string" && part.part_type.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "Part_Type is required",
          SHEET_NAMES.PARTS,
          rowNumber,
          "Part_Type"
        );
      }

      // E2: Duplicate ACR_SKU within file
      if (part.acr_sku) {
        if (skusInFile.has(part.acr_sku)) {
          this.addError(
            ValidationErrorCode.E2_DUPLICATE_ACR_SKU,
            `Duplicate ACR_SKU "${part.acr_sku}" found in file`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "ACR_SKU",
            part.acr_sku
          );
        }
        skusInFile.add(part.acr_sku);
      }

      // E4: Invalid UUID format (if _id is present)
      if (part._id && !UUID_REGEX.test(part._id)) {
        this.addError(
          ValidationErrorCode.E4_INVALID_UUID_FORMAT,
          `Invalid UUID format: "${part._id}"`,
          SHEET_NAMES.PARTS,
          rowNumber,
          "_id",
          part._id
        );
      }

      // E19: UUID not in database (if _id is present and valid format)
      if (
        part._id &&
        UUID_REGEX.test(part._id) &&
        !existingData.parts.has(part._id)
      ) {
        this.addError(
          ValidationErrorCode.E19_UUID_NOT_IN_DATABASE,
          `Part with _id "${part._id}" does not exist in database`,
          SHEET_NAMES.PARTS,
          rowNumber,
          "_id",
          part._id
        );
      }

      // E7: String exceeds max length
      this.validateMaxLength(
        part.acr_sku,
        MAX_LENGTHS.ACR_SKU,
        "ACR_SKU",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.part_type,
        MAX_LENGTHS.PART_TYPE,
        "Part_Type",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.position_type,
        MAX_LENGTHS.POSITION_TYPE,
        "Position_Type",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.abs_type,
        MAX_LENGTHS.ABS_TYPE,
        "ABS_Type",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.bolt_pattern,
        MAX_LENGTHS.BOLT_PATTERN,
        "Bolt_Pattern",
        SHEET_NAMES.PARTS,
        rowNumber
      );
      this.validateMaxLength(
        part.drive_type,
        MAX_LENGTHS.DRIVE_TYPE,
        "Drive_Type",
        SHEET_NAMES.PARTS,
        rowNumber
      );

      // E20: ACR_SKU must start with "ACR" prefix (only check if acr_sku exists)
      if (
        part.acr_sku &&
        typeof part.acr_sku === "string" &&
        !part.acr_sku.toUpperCase().startsWith("ACR")
      ) {
        this.addError(
          ValidationErrorCode.E20_INVALID_ACR_SKU_FORMAT,
          `ACR_SKU must start with "ACR" prefix. Found: "${part.acr_sku}". Please update the Excel file with the correct format (e.g., "ACR15002").`,
          SHEET_NAMES.PARTS,
          rowNumber,
          "ACR_SKU",
          part.acr_sku
        );
      }

      // E21: Invalid _action value (must be "DELETE" or empty)
      if (part._action && part._action.trim() !== "") {
        const actionValue = part._action.trim().toUpperCase();
        if (actionValue !== "DELETE") {
          this.addError(
            ValidationErrorCode.E21_INVALID_ACTION_VALUE,
            `Invalid _action value: "${part._action}". Must be "DELETE" or empty.`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "_action",
            part._action
          );
        }
      }

      // Validate brand columns (Phase 3A)
      this.validateBrandColumns(part, rowNumber);

      // Validate image URL columns (Phase 3B)
      this.validateImageUrlColumns(part, rowNumber);

      // Warnings: Compare with existing data
      if (part._id && existingData.parts.has(part._id)) {
        const existing = existingData.parts.get(part._id)!;

        // W1: ACR_SKU changed
        if (existing.acr_sku !== part.acr_sku) {
          this.addWarning(
            ValidationWarningCode.W1_ACR_SKU_CHANGED,
            `ACR_SKU changed from "${existing.acr_sku}" to "${part.acr_sku}"`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "ACR_SKU",
            part.acr_sku,
            existing.acr_sku
          );
        }

        // W3: Part_Type changed
        if (existing.part_type !== part.part_type) {
          this.addWarning(
            ValidationWarningCode.W3_PART_TYPE_CHANGED,
            `Part_Type changed from "${existing.part_type}" to "${part.part_type}"`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "Part_Type",
            part.part_type,
            existing.part_type
          );
        }

        // W4: Position_Type changed (only warn on actual changes, not null vs undefined)
        const normalizedExistingPosition = this.normalizeOptional(
          existing.position_type
        );
        const normalizedNewPosition = this.normalizeOptional(
          part.position_type
        );
        if (normalizedExistingPosition !== normalizedNewPosition) {
          this.addWarning(
            ValidationWarningCode.W4_POSITION_TYPE_CHANGED,
            `Position_Type changed from "${existing.position_type}" to "${part.position_type}"`,
            SHEET_NAMES.PARTS,
            rowNumber,
            "Position_Type",
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
    // Build part ID set from uploaded file (for _part_id references)
    const partIdsInFile = new Set(parts.map((p) => p._id).filter(Boolean));

    // Build ACR_SKU set from uploaded file (for acr_sku references)
    const partSkusInFile = new Set(parts.map((p) => p.acr_sku).filter(Boolean));

    // Combine with existing SKUs from database
    const allKnownSkus = new Set([...partSkusInFile, ...existingData.partSkus]);

    vehicles.forEach((vehicle, index) => {
      const rowNumber = index + 2;

      // E3: Empty required fields
      if (
        !vehicle.acr_sku ||
        (typeof vehicle.acr_sku === "string" && vehicle.acr_sku.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "ACR_SKU is required",
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "ACR_SKU"
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

      // E4: Invalid UUID format
      if (vehicle._id && !UUID_REGEX.test(vehicle._id)) {
        this.addError(
          ValidationErrorCode.E4_INVALID_UUID_FORMAT,
          `Invalid UUID format: "${vehicle._id}"`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "_id",
          vehicle._id
        );
      }

      if (vehicle._part_id && !UUID_REGEX.test(vehicle._part_id)) {
        this.addError(
          ValidationErrorCode.E4_INVALID_UUID_FORMAT,
          `Invalid UUID format for _part_id: "${vehicle._part_id}"`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "_part_id",
          vehicle._part_id
        );
      }

      // E5: Orphaned foreign key (ACR_SKU must reference a part in file or database)
      if (vehicle.acr_sku && !allKnownSkus.has(vehicle.acr_sku)) {
        this.addError(
          ValidationErrorCode.E5_ORPHANED_FOREIGN_KEY,
          `ACR_SKU "${vehicle.acr_sku}" does not reference any existing part`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "ACR_SKU",
          vehicle.acr_sku
        );
      }

      // E5: Orphaned foreign key (_part_id must reference a part in file) - only for updates
      if (vehicle._part_id && !partIdsInFile.has(vehicle._part_id)) {
        this.addError(
          ValidationErrorCode.E5_ORPHANED_FOREIGN_KEY,
          `_part_id "${vehicle._part_id}" does not reference any part in the Parts sheet`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "_part_id",
          vehicle._part_id
        );
      }

      // E6: Invalid year range
      if (
        vehicle.start_year &&
        vehicle.end_year &&
        vehicle.end_year < vehicle.start_year
      ) {
        this.addError(
          ValidationErrorCode.E6_INVALID_YEAR_RANGE,
          `End_Year (${vehicle.end_year}) cannot be before Start_Year (${vehicle.start_year})`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "End_Year"
        );
      }

      // E8: Year out of range
      if (
        vehicle.start_year &&
        (vehicle.start_year < YEAR_RANGE.MIN ||
          vehicle.start_year > YEAR_RANGE.MAX)
      ) {
        this.addError(
          ValidationErrorCode.E8_YEAR_OUT_OF_RANGE,
          `Start_Year ${vehicle.start_year} is out of valid range (${YEAR_RANGE.MIN}-${YEAR_RANGE.MAX})`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "Start_Year",
          vehicle.start_year
        );
      }

      if (
        vehicle.end_year &&
        (vehicle.end_year < YEAR_RANGE.MIN || vehicle.end_year > YEAR_RANGE.MAX)
      ) {
        this.addError(
          ValidationErrorCode.E8_YEAR_OUT_OF_RANGE,
          `End_Year ${vehicle.end_year} is out of valid range (${YEAR_RANGE.MIN}-${YEAR_RANGE.MAX})`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "End_Year",
          vehicle.end_year
        );
      }

      // E9: Invalid number format (years must be integers)
      if (vehicle.start_year && !Number.isInteger(vehicle.start_year)) {
        this.addError(
          ValidationErrorCode.E9_INVALID_NUMBER_FORMAT,
          `Start_Year must be an integer, got: ${vehicle.start_year}`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "Start_Year",
          vehicle.start_year
        );
      }

      if (vehicle.end_year && !Number.isInteger(vehicle.end_year)) {
        this.addError(
          ValidationErrorCode.E9_INVALID_NUMBER_FORMAT,
          `End_Year must be an integer, got: ${vehicle.end_year}`,
          SHEET_NAMES.VEHICLE_APPLICATIONS,
          rowNumber,
          "End_Year",
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

      // Warnings: Compare with existing data
      if (vehicle._id && existingData.vehicleApplications.has(vehicle._id)) {
        const existing = existingData.vehicleApplications.get(vehicle._id)!;

        // W2: Year range narrowed
        if (
          existing.start_year < vehicle.start_year ||
          existing.end_year > vehicle.end_year
        ) {
          this.addWarning(
            ValidationWarningCode.W2_YEAR_RANGE_NARROWED,
            `Year range narrowed from ${existing.start_year}-${existing.end_year} to ${vehicle.start_year}-${vehicle.end_year}`,
            SHEET_NAMES.VEHICLE_APPLICATIONS,
            rowNumber,
            "Start_Year / End_Year"
          );
        }

        // W8: Make changed
        if (existing.make !== vehicle.make) {
          this.addWarning(
            ValidationWarningCode.W8_VEHICLE_MAKE_CHANGED,
            `Make changed from "${existing.make}" to "${vehicle.make}"`,
            SHEET_NAMES.VEHICLE_APPLICATIONS,
            rowNumber,
            "Make",
            vehicle.make,
            existing.make
          );
        }

        // W9: Model changed
        if (existing.model !== vehicle.model) {
          this.addWarning(
            ValidationWarningCode.W9_VEHICLE_MODEL_CHANGED,
            `Model changed from "${existing.model}" to "${vehicle.model}"`,
            SHEET_NAMES.VEHICLE_APPLICATIONS,
            rowNumber,
            "Model",
            vehicle.model,
            existing.model
          );
        }
      }
    });

    // W6: Check for deleted vehicle applications
    existingData.vehicleApplications.forEach((existing, id) => {
      const stillExists = vehicles.some((v) => v._id === id);
      if (!stillExists) {
        this.addWarning(
          ValidationWarningCode.W6_VEHICLE_APPLICATION_DELETED,
          `Vehicle application deleted: ${existing.make} ${existing.model} ${existing.start_year}-${existing.end_year} (${existing.acr_sku})`,
          SHEET_NAMES.VEHICLE_APPLICATIONS
        );
      }
    });
  }

  // --------------------------------------------------------------------------
  // Cross References Sheet Validations (DEPRECATED)
  // --------------------------------------------------------------------------

  /**
   * @deprecated Phase 3 moved cross-references to Parts sheet brand columns.
   * This method is kept for reference only and is no longer called.
   */
  private validateCrossReferencesSheet(
    crossRefs: ExcelCrossRefRow[],
    parts: ExcelPartRow[],
    existingData: ExistingDatabaseData
  ): void {
    // Build part ID set from uploaded file (for _acr_part_id references)
    const partIdsInFile = new Set(parts.map((p) => p._id).filter(Boolean));

    // Build ACR_SKU set from uploaded file (for acr_sku references)
    const partSkusInFile = new Set(parts.map((p) => p.acr_sku).filter(Boolean));

    // Combine with existing SKUs from database
    const allKnownSkus = new Set([...partSkusInFile, ...existingData.partSkus]);

    crossRefs.forEach((crossRef, index) => {
      const rowNumber = index + 2;

      // E3: Empty required fields
      if (
        !crossRef.acr_sku ||
        (typeof crossRef.acr_sku === "string" && crossRef.acr_sku.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "ACR_SKU is required",
          SHEET_NAMES.CROSS_REFERENCES,
          rowNumber,
          "ACR_SKU"
        );
      }

      if (
        !crossRef.competitor_sku ||
        (typeof crossRef.competitor_sku === "string" &&
          crossRef.competitor_sku.trim() === "")
      ) {
        this.addError(
          ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD,
          "Competitor_SKU is required",
          SHEET_NAMES.CROSS_REFERENCES,
          rowNumber,
          "Competitor_SKU"
        );
      }

      // E4: Invalid UUID format
      if (crossRef._id && !UUID_REGEX.test(crossRef._id)) {
        this.addError(
          ValidationErrorCode.E4_INVALID_UUID_FORMAT,
          `Invalid UUID format: "${crossRef._id}"`,
          SHEET_NAMES.CROSS_REFERENCES,
          rowNumber,
          "_id",
          crossRef._id
        );
      }

      if (crossRef._acr_part_id && !UUID_REGEX.test(crossRef._acr_part_id)) {
        this.addError(
          ValidationErrorCode.E4_INVALID_UUID_FORMAT,
          `Invalid UUID format for _acr_part_id: "${crossRef._acr_part_id}"`,
          SHEET_NAMES.CROSS_REFERENCES,
          rowNumber,
          "_acr_part_id",
          crossRef._acr_part_id
        );
      }

      // E5: Orphaned foreign key (ACR_SKU must reference a part in file or database)
      if (crossRef.acr_sku && !allKnownSkus.has(crossRef.acr_sku)) {
        this.addError(
          ValidationErrorCode.E5_ORPHANED_FOREIGN_KEY,
          `ACR_SKU "${crossRef.acr_sku}" does not reference any existing part`,
          SHEET_NAMES.CROSS_REFERENCES,
          rowNumber,
          "ACR_SKU",
          crossRef.acr_sku
        );
      }

      // E5: Orphaned foreign key (_acr_part_id must reference a part in file) - only for updates
      if (crossRef._acr_part_id && !partIdsInFile.has(crossRef._acr_part_id)) {
        this.addError(
          ValidationErrorCode.E5_ORPHANED_FOREIGN_KEY,
          `_acr_part_id "${crossRef._acr_part_id}" does not reference any part in the Parts sheet`,
          SHEET_NAMES.CROSS_REFERENCES,
          rowNumber,
          "_acr_part_id",
          crossRef._acr_part_id
        );
      }

      // E7: String exceeds max length
      this.validateMaxLength(
        crossRef.competitor_brand,
        MAX_LENGTHS.COMPETITOR_BRAND,
        "Competitor_Brand",
        SHEET_NAMES.CROSS_REFERENCES,
        rowNumber
      );
      this.validateMaxLength(
        crossRef.competitor_sku,
        MAX_LENGTHS.COMPETITOR_SKU,
        "Competitor_SKU",
        SHEET_NAMES.CROSS_REFERENCES,
        rowNumber
      );

      // Warnings: Compare with existing data
      if (crossRef._id && existingData.crossReferences.has(crossRef._id)) {
        const existing = existingData.crossReferences.get(crossRef._id)!;

        // W10: Competitor brand changed
        if (existing.competitor_brand !== crossRef.competitor_brand) {
          this.addWarning(
            ValidationWarningCode.W10_COMPETITOR_BRAND_CHANGED,
            `Competitor_Brand changed from "${existing.competitor_brand}" to "${crossRef.competitor_brand}"`,
            SHEET_NAMES.CROSS_REFERENCES,
            rowNumber,
            "Competitor_Brand",
            crossRef.competitor_brand,
            existing.competitor_brand
          );
        }
      }
    });

    // W5: Check for deleted cross references
    existingData.crossReferences.forEach((existing, id) => {
      const stillExists = crossRefs.some((cr) => cr._id === id);
      if (!stillExists) {
        this.addWarning(
          ValidationWarningCode.W5_CROSS_REFERENCE_DELETED,
          `Cross-reference deleted: ${existing.acr_sku} → ${existing.competitor_brand} ${existing.competitor_sku}`,
          SHEET_NAMES.CROSS_REFERENCES
        );
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
  // Phase 3A: Brand Column Validations
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
  // Phase 3B: Image URL Validations
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
