// ============================================================================
// Shared Excel Constants - Single Source of Truth
// ============================================================================

/**
 * Excel sheet names (must match exactly between export and import)
 */
export const SHEET_NAMES = {
  PARTS: 'Parts',
  VEHICLE_APPLICATIONS: 'Vehicle Applications',
  CROSS_REFERENCES: 'Cross References',
} as const;

/**
 * Excel column headers (PascalCase with underscores)
 * These appear in the Excel file header row
 */
export const COLUMN_HEADERS = {
  // Parts sheet
  PARTS: {
    ID: '_id',
    ACR_SKU: 'ACR_SKU',
    PART_TYPE: 'Part_Type',
    POSITION_TYPE: 'Position_Type',
    ABS_TYPE: 'ABS_Type',
    BOLT_PATTERN: 'Bolt_Pattern',
    DRIVE_TYPE: 'Drive_Type',
    SPECIFICATIONS: 'Specifications',
  },

  // Vehicle Applications sheet
  VEHICLE_APPLICATIONS: {
    ID: '_id',
    PART_ID: '_part_id',
    ACR_SKU: 'ACR_SKU',
    MAKE: 'Make',
    MODEL: 'Model',
    START_YEAR: 'Start_Year',
    END_YEAR: 'End_Year',
  },

  // Cross References sheet
  CROSS_REFERENCES: {
    ID: '_id',
    ACR_PART_ID: '_acr_part_id',
    ACR_SKU: 'ACR_SKU',
    COMPETITOR_BRAND: 'Competitor_Brand',
    COMPETITOR_SKU: 'Competitor_SKU',
  },
} as const;

/**
 * Object property names (snake_case)
 * These are the keys used in JavaScript/TypeScript objects
 */
export const PROPERTY_NAMES = {
  // Parts
  PARTS: {
    ID: '_id',
    ACR_SKU: 'acr_sku',
    PART_TYPE: 'part_type',
    POSITION_TYPE: 'position_type',
    ABS_TYPE: 'abs_type',
    BOLT_PATTERN: 'bolt_pattern',
    DRIVE_TYPE: 'drive_type',
    SPECIFICATIONS: 'specifications',
  },

  // Vehicle Applications
  VEHICLE_APPLICATIONS: {
    ID: '_id',
    PART_ID: '_part_id',
    ACR_SKU: 'acr_sku',
    MAKE: 'make',
    MODEL: 'model',
    START_YEAR: 'start_year',
    END_YEAR: 'end_year',
  },

  // Cross References
  CROSS_REFERENCES: {
    ID: '_id',
    ACR_PART_ID: '_acr_part_id',
    ACR_SKU: 'acr_sku',
    COMPETITOR_BRAND: 'competitor_brand',
    COMPETITOR_SKU: 'competitor_sku',
  },
} as const;

/**
 * Column widths for Excel export
 */
export const COLUMN_WIDTHS = {
  // Parts sheet
  PARTS: {
    ID: 36,
    ACR_SKU: 15,
    PART_TYPE: 20,
    POSITION_TYPE: 15,
    ABS_TYPE: 15,
    BOLT_PATTERN: 15,
    DRIVE_TYPE: 15,
    SPECIFICATIONS: 40,
  },

  // Vehicle Applications sheet
  VEHICLE_APPLICATIONS: {
    ID: 36,
    PART_ID: 36,
    ACR_SKU: 15,
    MAKE: 15,
    MODEL: 20,
    START_YEAR: 12,
    END_YEAR: 12,
  },

  // Cross References sheet
  CROSS_REFERENCES: {
    ID: 36,
    ACR_PART_ID: 36,
    ACR_SKU: 15,
    COMPETITOR_BRAND: 20,
    COMPETITOR_SKU: 20,
  },
} as const;

/**
 * Hidden ID column names
 * These columns are hidden in Excel but critical for import matching
 */
export const HIDDEN_ID_COLUMNS = ['_id', '_part_id', '_acr_part_id'] as const;

/**
 * File validation constants
 */
export const FILE_VALIDATION = {
  VALID_EXTENSIONS: ['.xlsx', '.xls'] as const,
  VALID_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ] as const,
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
} as const;

/**
 * Helper function to convert column header to property name
 * Example: "ACR_SKU" → "acr_sku", "Part_Type" → "part_type"
 */
export function headerToPropertyName(header: string): string {
  // Hidden ID columns: keep as-is (lowercase)
  if (HIDDEN_ID_COLUMNS.includes(header as any)) {
    return header.toLowerCase();
  }

  // Regular columns: simply lowercase and normalize underscores
  // Excel headers already have underscores in the right places (ACR_SKU, Part_Type)
  // Just need to lowercase and collapse any double underscores
  return header
    .toLowerCase()
    .replace(/_+/g, '_'); // Collapse multiple underscores to single
}

/**
 * Helper function to convert property name to column header
 * Example: "acr_sku" → "ACR_SKU", "part_type" → "Part_Type"
 */
export function propertyNameToHeader(propertyName: string): string {
  // Hidden ID columns: keep as-is
  if (HIDDEN_ID_COLUMNS.includes(propertyName as any)) {
    return propertyName;
  }

  // Regular properties: convert to PascalCase with underscores
  return propertyName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_');
}

// ----------------------------------------------------------------------------
// Column Definitions (for Export Service)
// ----------------------------------------------------------------------------

/**
 * Parts sheet column definitions
 * Single source of truth for column structure
 *
 * Note: Not using 'as const' because ExcelJS expects mutable arrays
 */
export const PARTS_COLUMNS = [
  { header: COLUMN_HEADERS.PARTS.ID, key: PROPERTY_NAMES.PARTS.ID, width: COLUMN_WIDTHS.PARTS.ID, hidden: true },
  { header: COLUMN_HEADERS.PARTS.ACR_SKU, key: PROPERTY_NAMES.PARTS.ACR_SKU, width: COLUMN_WIDTHS.PARTS.ACR_SKU },
  { header: COLUMN_HEADERS.PARTS.PART_TYPE, key: PROPERTY_NAMES.PARTS.PART_TYPE, width: COLUMN_WIDTHS.PARTS.PART_TYPE },
  { header: COLUMN_HEADERS.PARTS.POSITION_TYPE, key: PROPERTY_NAMES.PARTS.POSITION_TYPE, width: COLUMN_WIDTHS.PARTS.POSITION_TYPE },
  { header: COLUMN_HEADERS.PARTS.ABS_TYPE, key: PROPERTY_NAMES.PARTS.ABS_TYPE, width: COLUMN_WIDTHS.PARTS.ABS_TYPE },
  { header: COLUMN_HEADERS.PARTS.BOLT_PATTERN, key: PROPERTY_NAMES.PARTS.BOLT_PATTERN, width: COLUMN_WIDTHS.PARTS.BOLT_PATTERN },
  { header: COLUMN_HEADERS.PARTS.DRIVE_TYPE, key: PROPERTY_NAMES.PARTS.DRIVE_TYPE, width: COLUMN_WIDTHS.PARTS.DRIVE_TYPE },
  { header: COLUMN_HEADERS.PARTS.SPECIFICATIONS, key: PROPERTY_NAMES.PARTS.SPECIFICATIONS, width: COLUMN_WIDTHS.PARTS.SPECIFICATIONS },
];

/**
 * Vehicle Applications sheet column definitions
 * Single source of truth for column structure
 */
export const VEHICLE_APPLICATIONS_COLUMNS = [
  { header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.ID, key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.ID, width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.ID, hidden: true },
  { header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.PART_ID, key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.PART_ID, width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.PART_ID, hidden: true },
  { header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.ACR_SKU, key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.ACR_SKU, width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.ACR_SKU },
  { header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.MAKE, key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.MAKE, width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.MAKE },
  { header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.MODEL, key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.MODEL, width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.MODEL },
  { header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.START_YEAR, key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.START_YEAR, width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.START_YEAR },
  { header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.END_YEAR, key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.END_YEAR, width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.END_YEAR },
];

/**
 * Cross References sheet column definitions
 * Single source of truth for column structure
 */
export const CROSS_REFERENCES_COLUMNS = [
  { header: COLUMN_HEADERS.CROSS_REFERENCES.ID, key: PROPERTY_NAMES.CROSS_REFERENCES.ID, width: COLUMN_WIDTHS.CROSS_REFERENCES.ID, hidden: true },
  { header: COLUMN_HEADERS.CROSS_REFERENCES.ACR_PART_ID, key: PROPERTY_NAMES.CROSS_REFERENCES.ACR_PART_ID, width: COLUMN_WIDTHS.CROSS_REFERENCES.ACR_PART_ID, hidden: true },
  { header: COLUMN_HEADERS.CROSS_REFERENCES.ACR_SKU, key: PROPERTY_NAMES.CROSS_REFERENCES.ACR_SKU, width: COLUMN_WIDTHS.CROSS_REFERENCES.ACR_SKU },
  { header: COLUMN_HEADERS.CROSS_REFERENCES.COMPETITOR_BRAND, key: PROPERTY_NAMES.CROSS_REFERENCES.COMPETITOR_BRAND, width: COLUMN_WIDTHS.CROSS_REFERENCES.COMPETITOR_BRAND },
  { header: COLUMN_HEADERS.CROSS_REFERENCES.COMPETITOR_SKU, key: PROPERTY_NAMES.CROSS_REFERENCES.COMPETITOR_SKU, width: COLUMN_WIDTHS.CROSS_REFERENCES.COMPETITOR_SKU },
];