// ============================================================================
// Validation Test Utilities - Mock data for component testing
// ============================================================================

/**
 * Validation issue (matches component interface)
 */
export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  sheet?: string;
  row?: number;
  column?: string;
  value?: any;
  expected?: any;
}

/**
 * Validation result (matches component interface)
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    errorsBySheet: Record<string, number>;
    warningsBySheet: Record<string, number>;
  };
}

/**
 * Create a mock validation error
 */
export function createMockError(overrides?: Partial<ValidationIssue>): ValidationIssue {
  return {
    code: 'E2',
    severity: 'error',
    message: 'Duplicate ACR SKU found',
    sheet: 'Parts',
    row: 10,
    column: 'ACR_SKU',
    value: 'ACR-001',
    ...overrides,
  };
}

/**
 * Create a mock validation warning
 */
export function createMockWarning(overrides?: Partial<ValidationIssue>): ValidationIssue {
  return {
    code: 'W1',
    severity: 'warning',
    message: 'This will update an existing part',
    sheet: 'Parts',
    row: 5,
    column: 'ACR_SKU',
    value: 'ACR-001',
    expected: 'Original Value',
    ...overrides,
  };
}

/**
 * Create a mock validation result
 */
export function createMockValidationResult(
  overrides?: Partial<ValidationResult>
): ValidationResult {
  const errors = overrides?.errors || [];
  const warnings = overrides?.warnings || [];

  const errorsBySheet: Record<string, number> = {};
  const warningsBySheet: Record<string, number> = {};

  errors.forEach((error: ValidationIssue) => {
    const sheet = error.sheet || 'General';
    errorsBySheet[sheet] = (errorsBySheet[sheet] || 0) + 1;
  });

  warnings.forEach((warning: ValidationIssue) => {
    const sheet = warning.sheet || 'General';
    warningsBySheet[sheet] = (warningsBySheet[sheet] || 0) + 1;
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      errorsBySheet,
      warningsBySheet,
    },
    ...overrides,
  };
}

/**
 * Create a successful validation result (no errors/warnings)
 */
export function createSuccessValidationResult(): ValidationResult {
  return createMockValidationResult({
    valid: true,
    errors: [],
    warnings: [],
  });
}

/**
 * Create a validation result with only errors
 */
export function createErrorValidationResult(errorCodes: string[]): ValidationResult {
  const errors = errorCodes.map((code, idx) =>
    createMockError({
      code,
      row: idx + 2,
      message: `Error ${code} occurred`,
    })
  );

  return createMockValidationResult({ errors });
}

/**
 * Create a validation result with only warnings
 */
export function createWarningValidationResult(warningCodes: string[]): ValidationResult {
  const warnings = warningCodes.map((code, idx) =>
    createMockWarning({
      code,
      row: idx + 2,
      message: `Warning ${code} occurred`,
    })
  );

  return createMockValidationResult({
    valid: true,
    warnings,
  });
}

/**
 * Create a validation result with both errors and warnings
 */
export function createMixedValidationResult(
  errorCodes: string[],
  warningCodes: string[]
): ValidationResult {
  const errors = errorCodes.map((code, idx) =>
    createMockError({
      code,
      row: idx + 2,
      message: `Error ${code} occurred`,
    })
  );

  const warnings = warningCodes.map((code, idx) =>
    createMockWarning({
      code,
      row: idx + 100,
      message: `Warning ${code} occurred`,
    })
  );

  return createMockValidationResult({ errors, warnings });
}

/**
 * Create a validation result with multi-sheet errors
 */
export function createMultiSheetErrorResult(): ValidationResult {
  const errors = [
    createMockError({ code: 'E2', sheet: 'Parts', row: 5 }),
    createMockError({ code: 'E3', sheet: 'Parts', row: 10 }),
    createMockError({ code: 'E11', sheet: 'Vehicle Applications', row: 20 }),
    createMockError({ code: 'E12', sheet: 'Vehicle Applications', row: 25 }),
    createMockError({ code: 'E14', sheet: 'Cross References', row: 30 }),
  ];

  return createMockValidationResult({ errors });
}

/**
 * Create a validation result with multi-sheet warnings
 */
export function createMultiSheetWarningResult(): ValidationResult {
  const warnings = [
    createMockWarning({ code: 'W1', sheet: 'Parts', row: 5 }),
    createMockWarning({ code: 'W2', sheet: 'Parts', row: 10 }),
    createMockWarning({ code: 'W5', sheet: 'Vehicle Applications', row: 20 }),
    createMockWarning({ code: 'W6', sheet: 'Cross References', row: 30 }),
  ];

  return createMockValidationResult({
    valid: true,
    warnings,
  });
}

/**
 * All documented error codes from ValidationEngine
 */
export const ALL_ERROR_CODES = [
  'E1', // Missing hidden columns
  'E2', // Duplicate ACR SKU
  'E3', // Empty required field
  'E4', // Invalid part type
  'E5', // Invalid position type
  'E6', // Invalid ABS type
  'E7', // Invalid drive type
  'E8', // Invalid UUID format
  'E9', // UUID not in database
  'E10', // Missing part ID reference
  'E11', // Invalid vehicle year
  'E12', // End year before start year
  'E13', // Missing cross-reference ACR part
  'E14', // Invalid UUID in cross-reference
  'E15', // Orphaned vehicle application
  'E16', // Orphaned cross-reference
  'E17', // Vehicle app references missing part SKU
  'E18', // Cross-ref references missing part SKU
  'E19', // UUID not in database (vehicle/cross-ref)
];

/**
 * All documented warning codes from ValidationEngine
 */
export const ALL_WARNING_CODES = [
  'W1', // Update will modify existing part
  'W2', // Update will modify existing vehicle app
  'W3', // Update will modify existing cross-ref
  'W4', // Deletion will remove part
  'W5', // Deletion will remove vehicle app
  'W6', // Deletion will remove cross-ref
  'W7', // Large number of changes
  'W8', // Potential data loss
  'W9', // Deprecated field usage
  'W10', // Performance warning
];
