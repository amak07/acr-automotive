// ============================================================================
// Validation Types - Error and Warning Definitions
// ============================================================================

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  ERROR = 'ERROR', // Blocks import
  WARNING = 'WARNING', // Allows import with user confirmation
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  // File-level errors (E1-E7)
  E1_MISSING_HIDDEN_COLUMNS = 'E1_MISSING_HIDDEN_COLUMNS',
  E2_DUPLICATE_ACR_SKU = 'E2_DUPLICATE_ACR_SKU',
  E3_EMPTY_REQUIRED_FIELD = 'E3_EMPTY_REQUIRED_FIELD',
  E4_INVALID_UUID_FORMAT = 'E4_INVALID_UUID_FORMAT',
  E5_ORPHANED_FOREIGN_KEY = 'E5_ORPHANED_FOREIGN_KEY',
  E6_INVALID_YEAR_RANGE = 'E6_INVALID_YEAR_RANGE',
  E7_STRING_EXCEEDS_MAX_LENGTH = 'E7_STRING_EXCEEDS_MAX_LENGTH',

  // Sheet-level errors (E8-E13)
  E8_YEAR_OUT_OF_RANGE = 'E8_YEAR_OUT_OF_RANGE',
  E9_INVALID_NUMBER_FORMAT = 'E9_INVALID_NUMBER_FORMAT',
  E10_REQUIRED_SHEET_MISSING = 'E10_REQUIRED_SHEET_MISSING',
  E11_DUPLICATE_HEADER_COLUMNS = 'E11_DUPLICATE_HEADER_COLUMNS',
  E12_MISSING_REQUIRED_HEADERS = 'E12_MISSING_REQUIRED_HEADERS',
  E13_INVALID_SHEET_NAME = 'E13_INVALID_SHEET_NAME',

  // File format errors (E14-E17)
  E14_FILE_FORMAT_INVALID = 'E14_FILE_FORMAT_INVALID',
  E15_FILE_SIZE_EXCEEDS_LIMIT = 'E15_FILE_SIZE_EXCEEDS_LIMIT',
  E16_MALFORMED_EXCEL_FILE = 'E16_MALFORMED_EXCEL_FILE',
  E17_ENCODING_ERROR = 'E17_ENCODING_ERROR',

  // Data integrity errors (E18-E19)
  E18_REFERENTIAL_INTEGRITY_VIOLATION = 'E18_REFERENTIAL_INTEGRITY_VIOLATION',
  E19_UUID_NOT_IN_DATABASE = 'E19_UUID_NOT_IN_DATABASE',

  // SKU format errors (E20)
  E20_INVALID_ACR_SKU_FORMAT = 'E20_INVALID_ACR_SKU_FORMAT',
}

/**
 * Validation warning codes
 */
export enum ValidationWarningCode {
  W1_ACR_SKU_CHANGED = 'W1_ACR_SKU_CHANGED',
  W2_YEAR_RANGE_NARROWED = 'W2_YEAR_RANGE_NARROWED',
  W3_PART_TYPE_CHANGED = 'W3_PART_TYPE_CHANGED',
  W4_POSITION_TYPE_CHANGED = 'W4_POSITION_TYPE_CHANGED',
  W5_CROSS_REFERENCE_DELETED = 'W5_CROSS_REFERENCE_DELETED',
  W6_VEHICLE_APPLICATION_DELETED = 'W6_VEHICLE_APPLICATION_DELETED',
  W7_SPECIFICATIONS_SHORTENED = 'W7_SPECIFICATIONS_SHORTENED',
  W8_VEHICLE_MAKE_CHANGED = 'W8_VEHICLE_MAKE_CHANGED',
  W9_VEHICLE_MODEL_CHANGED = 'W9_VEHICLE_MODEL_CHANGED',
  W10_COMPETITOR_BRAND_CHANGED = 'W10_COMPETITOR_BRAND_CHANGED',
}

/**
 * Validation issue (error or warning)
 */
export interface ValidationIssue {
  code: ValidationErrorCode | ValidationWarningCode;
  severity: ValidationSeverity;
  message: string;
  sheet?: string; // Sheet name where issue occurred
  row?: number; // Row number (1-indexed, includes header)
  column?: string; // Column name
  value?: any; // Problematic value
  expected?: any; // Expected value (for comparison warnings)
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean; // False if any errors (warnings don't affect this)
  errors: ValidationIssue[]; // Blocks import
  warnings: ValidationIssue[]; // Allows import with confirmation
  summary: {
    totalErrors: number;
    totalWarnings: number;
    errorsBySheet: Record<string, number>;
    warningsBySheet: Record<string, number>;
  };
}