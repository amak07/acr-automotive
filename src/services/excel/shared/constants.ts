// ============================================================================
// Shared Excel Constants - Single Source of Truth
// ============================================================================

/**
 * Excel sheet names (must match exactly between export and import)
 * Note: As of Phase 3, exports only produce 2 sheets (Parts, Vehicle Applications).
 * Cross-references are now inline in Parts sheet as brand columns.
 */
export const SHEET_NAMES = {
  PARTS: "Parts",
  VEHICLE_APPLICATIONS: "Vehicle Applications",
  /** @deprecated Cross-references now in Parts sheet brand columns */
  CROSS_REFERENCES: "Cross References",
  /** Vehicle aliases for keyword search (Phase 4A) */
  ALIASES: "Vehicle Aliases",
} as const;

/**
 * Excel column headers (friendly names without underscores)
 * These appear in the Excel file header row (Row 2)
 */
export const COLUMN_HEADERS = {
  // Parts sheet
  PARTS: {
    ID: "_id",
    ACTION: "_action", // ML-style: set to "DELETE" to explicitly delete a part
    ACR_SKU: "ACR SKU",
    STATUS: "Status", // Workflow status (Activo/Inactivo/Eliminar)
    PART_TYPE: "Part Type",
    POSITION_TYPE: "Position",
    ABS_TYPE: "ABS Type",
    BOLT_PATTERN: "Bolt Pattern",
    DRIVE_TYPE: "Drive Type",
    SPECIFICATIONS: "Specifications",
    // Cross-reference brand columns (Phase 3A) - just brand names
    NATIONAL_SKUS: "National",
    ATV_SKUS: "ATV",
    SYD_SKUS: "SYD",
    TMK_SKUS: "TMK",
    GROB_SKUS: "GROB",
    RACE_SKUS: "RACE",
    OEM_SKUS: "OEM",
    OEM_2_SKUS: "OEM_2",
    GMB_SKUS: "GMB",
    GSP_SKUS: "GSP",
    FAG_SKUS: "FAG",
    // Image URL columns (Phase 3B) - friendly names
    IMAGE_URL_FRONT: "Image URL Front",
    IMAGE_URL_BACK: "Image URL Back",
    IMAGE_URL_TOP: "Image URL Top",
    IMAGE_URL_OTHER: "Image URL Other",
    VIEWER_360_STATUS: "360 Viewer",
  },

  // Vehicle Applications sheet
  VEHICLE_APPLICATIONS: {
    ID: "_id",
    PART_ID: "_part_id",
    ACR_SKU: "ACR SKU",
    MAKE: "Make",
    MODEL: "Model",
    START_YEAR: "Start Year",
    END_YEAR: "End Year",
  },

  // Cross References sheet
  CROSS_REFERENCES: {
    ID: "_id",
    ACR_PART_ID: "_acr_part_id",
    ACR_SKU: "ACR_SKU",
    COMPETITOR_BRAND: "Competitor_Brand",
    COMPETITOR_SKU: "Competitor_SKU",
  },

  // Vehicle Aliases sheet (Phase 4A)
  ALIASES: {
    ID: "_id",
    ALIAS: "Alias",
    CANONICAL_NAME: "Canonical Name",
    ALIAS_TYPE: "Type",
  },
} as const;

/**
 * Object property names (snake_case)
 * These are the keys used in JavaScript/TypeScript objects
 */
export const PROPERTY_NAMES = {
  // Parts
  PARTS: {
    ID: "_id",
    ACTION: "_action", // ML-style: set to "DELETE" to explicitly delete a part
    ACR_SKU: "acr_sku",
    STATUS: "status", // Workflow status
    PART_TYPE: "part_type",
    POSITION_TYPE: "position_type",
    ABS_TYPE: "abs_type",
    BOLT_PATTERN: "bolt_pattern",
    DRIVE_TYPE: "drive_type",
    SPECIFICATIONS: "specifications",
    // Cross-reference brand columns (Phase 3A)
    NATIONAL_SKUS: "national_skus",
    ATV_SKUS: "atv_skus",
    SYD_SKUS: "syd_skus",
    TMK_SKUS: "tmk_skus",
    GROB_SKUS: "grob_skus",
    RACE_SKUS: "race_skus",
    OEM_SKUS: "oem_skus",
    OEM_2_SKUS: "oem_2_skus",
    GMB_SKUS: "gmb_skus",
    GSP_SKUS: "gsp_skus",
    FAG_SKUS: "fag_skus",
    // Image URL columns (Phase 3B)
    IMAGE_URL_FRONT: "image_url_front",
    IMAGE_URL_BACK: "image_url_back",
    IMAGE_URL_TOP: "image_url_top",
    IMAGE_URL_OTHER: "image_url_other",
    VIEWER_360_STATUS: "viewer_360_status",
  },

  // Vehicle Applications
  VEHICLE_APPLICATIONS: {
    ID: "_id",
    PART_ID: "_part_id",
    ACR_SKU: "acr_sku",
    MAKE: "make",
    MODEL: "model",
    START_YEAR: "start_year",
    END_YEAR: "end_year",
  },

  // Cross References
  CROSS_REFERENCES: {
    ID: "_id",
    ACR_PART_ID: "_acr_part_id",
    ACR_SKU: "acr_sku",
    COMPETITOR_BRAND: "competitor_brand",
    COMPETITOR_SKU: "competitor_sku",
  },

  // Vehicle Aliases (Phase 4A)
  ALIASES: {
    ID: "_id",
    ALIAS: "alias",
    CANONICAL_NAME: "canonical_name",
    ALIAS_TYPE: "alias_type",
  },
} as const;

/**
 * Column widths for Excel export
 */
export const COLUMN_WIDTHS = {
  // Parts sheet
  PARTS: {
    ID: 36,
    ACTION: 10, // For "DELETE" marker
    ACR_SKU: 15,
    STATUS: 12, // Workflow status (Activo/Inactivo/Eliminar)
    PART_TYPE: 20,
    POSITION_TYPE: 15,
    ABS_TYPE: 15,
    BOLT_PATTERN: 15,
    DRIVE_TYPE: 15,
    SPECIFICATIONS: 40,
    // Cross-reference brand columns (Phase 3A)
    NATIONAL_SKUS: 25,
    ATV_SKUS: 25,
    SYD_SKUS: 25,
    TMK_SKUS: 25,
    GROB_SKUS: 25,
    RACE_SKUS: 25,
    OEM_SKUS: 25,
    OEM_2_SKUS: 25,
    GMB_SKUS: 25,
    GSP_SKUS: 25,
    FAG_SKUS: 25,
    // Image URL columns (Phase 3B)
    IMAGE_URL_FRONT: 50,
    IMAGE_URL_BACK: 50,
    IMAGE_URL_TOP: 50,
    IMAGE_URL_OTHER: 50,
    VIEWER_360_STATUS: 18,
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

  // Vehicle Aliases sheet (Phase 4A)
  ALIASES: {
    ID: 36,
    ALIAS: 20,
    CANONICAL_NAME: 25,
    ALIAS_TYPE: 12,
  },
} as const;

/**
 * Hidden ID column names
 * These columns are hidden in Excel but critical for import matching
 */
export const HIDDEN_ID_COLUMNS = ["_id", "_part_id", "_acr_part_id"] as const;

/**
 * Hidden computed columns
 * These columns are auto-generated by database triggers and should NOT be exported
 * They will be regenerated on import by database triggers
 */
export const HIDDEN_COMPUTED_COLUMNS = [
  "acr_sku_normalized",
  "competitor_sku_normalized",
  "created_at",
  "updated_at",
] as const;

/**
 * File validation constants
 */
export const FILE_VALIDATION = {
  VALID_EXTENSIONS: [".xlsx", ".xls"] as const,
  VALID_MIME_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ] as const,
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
} as const;

// ============================================================================
// Phase 3 Constants: Cross-Reference Brand Columns & Image URLs
// ============================================================================

/**
 * Brand column property name → database competitor_brand value mapping
 * Used to convert Excel column data to cross_references records
 */
export const BRAND_COLUMN_MAP: Record<string, string> = {
  national_skus: "NATIONAL",
  atv_skus: "ATV",
  syd_skus: "SYD",
  tmk_skus: "TMK",
  grob_skus: "GROB",
  race_skus: "RACE",
  oem_skus: "OEM",
  oem_2_skus: "OEM 2",
  gmb_skus: "GMB",
  gsp_skus: "GSP",
  fag_skus: "FAG",
};

/**
 * All brand column property names (for iteration)
 */
export const BRAND_COLUMN_NAMES = Object.keys(BRAND_COLUMN_MAP);

/**
 * Image URL column property name → view_type value mapping
 * Used to convert Excel column data to part_images records
 */
export const IMAGE_VIEW_TYPE_MAP: Record<string, string> = {
  image_url_front: "front",
  image_url_back: "back",
  image_url_top: "top",
  image_url_other: "other",
};

/**
 * All image URL column property names (for iteration)
 */
export const IMAGE_URL_COLUMN_NAMES = Object.keys(IMAGE_VIEW_TYPE_MAP);

/**
 * Delete marker for explicit cross-reference deletion (ML-style safe delete)
 * Usage in Excel: "[DELETE]SKU123" marks SKU123 for deletion
 */
export const DELETE_MARKER = "[DELETE]";

/**
 * Mapping of simplified brand column headers to property names
 * Used for import when headers don't have "_SKUs" suffix
 */
const BRAND_HEADER_TO_PROPERTY: Record<string, string> = {
  national: "national_skus",
  atv: "atv_skus",
  syd: "syd_skus",
  tmk: "tmk_skus",
  grob: "grob_skus",
  race: "race_skus",
  oem: "oem_skus",
  oem_2: "oem_2_skus",
  gmb: "gmb_skus",
  gsp: "gsp_skus",
  fag: "fag_skus",
};

/**
 * Mapping of friendly column headers (without underscores) to property names
 * Used for import when headers use spaces instead of underscores
 */
const FRIENDLY_HEADER_TO_PROPERTY: Record<string, string> = {
  // Part Information (friendly → property)
  "acr sku": "acr_sku",
  status: "status", // Workflow status
  "part type": "part_type",
  position: "position_type",
  "abs type": "abs_type",
  "bolt pattern": "bolt_pattern",
  "drive type": "drive_type",
  // Image columns (friendly → property)
  "image url front": "image_url_front",
  "image url back": "image_url_back",
  "image url top": "image_url_top",
  "image url other": "image_url_other",
  "360 viewer": "viewer_360_status",
  // Vehicle Applications (friendly → property)
  "start year": "start_year",
  "end year": "end_year",
  // Aliases (friendly → property)
  "canonical name": "canonical_name",
  type: "alias_type",
};

/**
 * Helper function to convert column header to property name
 * Supports both old format (with underscores) and new format (with spaces)
 *
 * Examples:
 * - Old: "ACR_SKU" → "acr_sku", "Part_Type" → "part_type"
 * - New: "ACR SKU" → "acr_sku", "Part Type" → "part_type"
 * - Brand: "National" → "national_skus"
 */
export function headerToPropertyName(header: string): string {
  // Hidden ID columns: keep as-is (lowercase)
  if (HIDDEN_ID_COLUMNS.includes(header as any)) {
    return header.toLowerCase();
  }

  // Normalize: lowercase and convert underscores to spaces for lookup
  const lowercased = header.toLowerCase();

  // Check friendly header mapping first (headers with spaces)
  if (FRIENDLY_HEADER_TO_PROPERTY[lowercased]) {
    return FRIENDLY_HEADER_TO_PROPERTY[lowercased];
  }

  // Check if this is a simplified brand column header (e.g., "National" → "national_skus")
  if (BRAND_HEADER_TO_PROPERTY[lowercased]) {
    return BRAND_HEADER_TO_PROPERTY[lowercased];
  }

  // Fallback: convert underscores to property format
  // Excel headers with underscores: just lowercase and collapse double underscores
  return lowercased.replace(/\s+/g, "_").replace(/_+/g, "_");
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
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("_");
}

/**
 * Cross-reference SKU delimiter - semicolon is the canonical delimiter
 */
export const CROSS_REF_DELIMITER = ";";

/**
 * Result of splitting cross-reference SKUs
 */
export interface SplitCrossRefResult {
  /** The individual SKUs after splitting */
  skus: string[];
  /** Whether the original value contained space-delimited SKUs (legacy format) */
  hadSpaceDelimiters: boolean;
}

/**
 * Split cross-reference SKUs from a cell value.
 * Handles both semicolon (new format) and space (legacy format) delimiters.
 *
 * - Semicolon is the canonical delimiter for new data
 * - Space delimiter is supported for backwards compatibility with old data
 * - When spaces are detected, hadSpaceDelimiters is set to true for warnings
 *
 * @param value - The raw cell value containing one or more SKUs
 * @returns Object with split SKUs and whether legacy space delimiters were found
 */
export function splitCrossRefSkus(
  value: string | undefined | null
): SplitCrossRefResult {
  if (!value || value.trim() === "") {
    return { skus: [], hadSpaceDelimiters: false };
  }

  const trimmedValue = value.trim();

  // Check if value contains semicolons - use semicolon delimiter only
  if (trimmedValue.includes(";")) {
    const skus = trimmedValue
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    return { skus, hadSpaceDelimiters: false };
  }

  // No semicolons - check if value contains spaces (legacy format)
  // Only split on spaces if there are multiple words that look like SKUs
  if (trimmedValue.includes(" ")) {
    const parts = trimmedValue
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => s !== "");

    // Only treat as space-delimited if we get multiple parts
    if (parts.length > 1) {
      return { skus: parts, hadSpaceDelimiters: true };
    }
  }

  // Single value (no delimiters)
  return { skus: [trimmedValue], hadSpaceDelimiters: false };
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
  // Core part fields
  {
    header: COLUMN_HEADERS.PARTS.ID,
    key: PROPERTY_NAMES.PARTS.ID,
    width: COLUMN_WIDTHS.PARTS.ID,
    hidden: true,
  },
  {
    header: COLUMN_HEADERS.PARTS.ACTION,
    key: PROPERTY_NAMES.PARTS.ACTION,
    width: COLUMN_WIDTHS.PARTS.ACTION,
    hidden: true,
  },
  {
    header: COLUMN_HEADERS.PARTS.ACR_SKU,
    key: PROPERTY_NAMES.PARTS.ACR_SKU,
    width: COLUMN_WIDTHS.PARTS.ACR_SKU,
  },
  {
    header: COLUMN_HEADERS.PARTS.STATUS,
    key: PROPERTY_NAMES.PARTS.STATUS,
    width: COLUMN_WIDTHS.PARTS.STATUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.PART_TYPE,
    key: PROPERTY_NAMES.PARTS.PART_TYPE,
    width: COLUMN_WIDTHS.PARTS.PART_TYPE,
  },
  {
    header: COLUMN_HEADERS.PARTS.POSITION_TYPE,
    key: PROPERTY_NAMES.PARTS.POSITION_TYPE,
    width: COLUMN_WIDTHS.PARTS.POSITION_TYPE,
  },
  {
    header: COLUMN_HEADERS.PARTS.ABS_TYPE,
    key: PROPERTY_NAMES.PARTS.ABS_TYPE,
    width: COLUMN_WIDTHS.PARTS.ABS_TYPE,
  },
  {
    header: COLUMN_HEADERS.PARTS.BOLT_PATTERN,
    key: PROPERTY_NAMES.PARTS.BOLT_PATTERN,
    width: COLUMN_WIDTHS.PARTS.BOLT_PATTERN,
  },
  {
    header: COLUMN_HEADERS.PARTS.DRIVE_TYPE,
    key: PROPERTY_NAMES.PARTS.DRIVE_TYPE,
    width: COLUMN_WIDTHS.PARTS.DRIVE_TYPE,
  },
  {
    header: COLUMN_HEADERS.PARTS.SPECIFICATIONS,
    key: PROPERTY_NAMES.PARTS.SPECIFICATIONS,
    width: COLUMN_WIDTHS.PARTS.SPECIFICATIONS,
  },
  // Cross-reference brand columns (Phase 3A) - semicolon-separated SKUs
  {
    header: COLUMN_HEADERS.PARTS.NATIONAL_SKUS,
    key: PROPERTY_NAMES.PARTS.NATIONAL_SKUS,
    width: COLUMN_WIDTHS.PARTS.NATIONAL_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.ATV_SKUS,
    key: PROPERTY_NAMES.PARTS.ATV_SKUS,
    width: COLUMN_WIDTHS.PARTS.ATV_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.SYD_SKUS,
    key: PROPERTY_NAMES.PARTS.SYD_SKUS,
    width: COLUMN_WIDTHS.PARTS.SYD_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.TMK_SKUS,
    key: PROPERTY_NAMES.PARTS.TMK_SKUS,
    width: COLUMN_WIDTHS.PARTS.TMK_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.GROB_SKUS,
    key: PROPERTY_NAMES.PARTS.GROB_SKUS,
    width: COLUMN_WIDTHS.PARTS.GROB_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.RACE_SKUS,
    key: PROPERTY_NAMES.PARTS.RACE_SKUS,
    width: COLUMN_WIDTHS.PARTS.RACE_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.OEM_SKUS,
    key: PROPERTY_NAMES.PARTS.OEM_SKUS,
    width: COLUMN_WIDTHS.PARTS.OEM_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.OEM_2_SKUS,
    key: PROPERTY_NAMES.PARTS.OEM_2_SKUS,
    width: COLUMN_WIDTHS.PARTS.OEM_2_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.GMB_SKUS,
    key: PROPERTY_NAMES.PARTS.GMB_SKUS,
    width: COLUMN_WIDTHS.PARTS.GMB_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.GSP_SKUS,
    key: PROPERTY_NAMES.PARTS.GSP_SKUS,
    width: COLUMN_WIDTHS.PARTS.GSP_SKUS,
  },
  {
    header: COLUMN_HEADERS.PARTS.FAG_SKUS,
    key: PROPERTY_NAMES.PARTS.FAG_SKUS,
    width: COLUMN_WIDTHS.PARTS.FAG_SKUS,
  },
  // Image URL columns (Phase 3B)
  {
    header: COLUMN_HEADERS.PARTS.IMAGE_URL_FRONT,
    key: PROPERTY_NAMES.PARTS.IMAGE_URL_FRONT,
    width: COLUMN_WIDTHS.PARTS.IMAGE_URL_FRONT,
  },
  {
    header: COLUMN_HEADERS.PARTS.IMAGE_URL_BACK,
    key: PROPERTY_NAMES.PARTS.IMAGE_URL_BACK,
    width: COLUMN_WIDTHS.PARTS.IMAGE_URL_BACK,
  },
  {
    header: COLUMN_HEADERS.PARTS.IMAGE_URL_TOP,
    key: PROPERTY_NAMES.PARTS.IMAGE_URL_TOP,
    width: COLUMN_WIDTHS.PARTS.IMAGE_URL_TOP,
  },
  {
    header: COLUMN_HEADERS.PARTS.IMAGE_URL_OTHER,
    key: PROPERTY_NAMES.PARTS.IMAGE_URL_OTHER,
    width: COLUMN_WIDTHS.PARTS.IMAGE_URL_OTHER,
  },
  {
    header: COLUMN_HEADERS.PARTS.VIEWER_360_STATUS,
    key: PROPERTY_NAMES.PARTS.VIEWER_360_STATUS,
    width: COLUMN_WIDTHS.PARTS.VIEWER_360_STATUS,
  },
];

/**
 * Vehicle Applications sheet column definitions
 * Single source of truth for column structure
 */
export const VEHICLE_APPLICATIONS_COLUMNS = [
  {
    header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.ID,
    key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.ID,
    width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.ID,
    hidden: true,
  },
  {
    header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.PART_ID,
    key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.PART_ID,
    width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.PART_ID,
    hidden: true,
  },
  {
    header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.ACR_SKU,
    key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.ACR_SKU,
    width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.ACR_SKU,
  },
  {
    header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.MAKE,
    key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.MAKE,
    width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.MAKE,
  },
  {
    header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.MODEL,
    key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.MODEL,
    width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.MODEL,
  },
  {
    header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.START_YEAR,
    key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.START_YEAR,
    width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.START_YEAR,
  },
  {
    header: COLUMN_HEADERS.VEHICLE_APPLICATIONS.END_YEAR,
    key: PROPERTY_NAMES.VEHICLE_APPLICATIONS.END_YEAR,
    width: COLUMN_WIDTHS.VEHICLE_APPLICATIONS.END_YEAR,
  },
];

/**
 * Cross References sheet column definitions
 * @deprecated Phase 3 moves cross-references to brand columns in Parts sheet.
 * This sheet is no longer exported. Kept for backward compatibility with old imports.
 */
export const CROSS_REFERENCES_COLUMNS = [
  {
    header: COLUMN_HEADERS.CROSS_REFERENCES.ID,
    key: PROPERTY_NAMES.CROSS_REFERENCES.ID,
    width: COLUMN_WIDTHS.CROSS_REFERENCES.ID,
    hidden: true,
  },
  {
    header: COLUMN_HEADERS.CROSS_REFERENCES.ACR_PART_ID,
    key: PROPERTY_NAMES.CROSS_REFERENCES.ACR_PART_ID,
    width: COLUMN_WIDTHS.CROSS_REFERENCES.ACR_PART_ID,
    hidden: true,
  },
  {
    header: COLUMN_HEADERS.CROSS_REFERENCES.ACR_SKU,
    key: PROPERTY_NAMES.CROSS_REFERENCES.ACR_SKU,
    width: COLUMN_WIDTHS.CROSS_REFERENCES.ACR_SKU,
  },
  {
    header: COLUMN_HEADERS.CROSS_REFERENCES.COMPETITOR_BRAND,
    key: PROPERTY_NAMES.CROSS_REFERENCES.COMPETITOR_BRAND,
    width: COLUMN_WIDTHS.CROSS_REFERENCES.COMPETITOR_BRAND,
  },
  {
    header: COLUMN_HEADERS.CROSS_REFERENCES.COMPETITOR_SKU,
    key: PROPERTY_NAMES.CROSS_REFERENCES.COMPETITOR_SKU,
    width: COLUMN_WIDTHS.CROSS_REFERENCES.COMPETITOR_SKU,
  },
];

/**
 * Vehicle Aliases sheet column definitions (Phase 4A)
 * Allows Humberto to manage vehicle nickname mappings via Excel
 */
export const ALIASES_COLUMNS = [
  {
    header: COLUMN_HEADERS.ALIASES.ID,
    key: PROPERTY_NAMES.ALIASES.ID,
    width: COLUMN_WIDTHS.ALIASES.ID,
    hidden: true,
  },
  {
    header: COLUMN_HEADERS.ALIASES.ALIAS,
    key: PROPERTY_NAMES.ALIASES.ALIAS,
    width: COLUMN_WIDTHS.ALIASES.ALIAS,
  },
  {
    header: COLUMN_HEADERS.ALIASES.CANONICAL_NAME,
    key: PROPERTY_NAMES.ALIASES.CANONICAL_NAME,
    width: COLUMN_WIDTHS.ALIASES.CANONICAL_NAME,
  },
  {
    header: COLUMN_HEADERS.ALIASES.ALIAS_TYPE,
    key: PROPERTY_NAMES.ALIASES.ALIAS_TYPE,
    width: COLUMN_WIDTHS.ALIASES.ALIAS_TYPE,
  },
];

// ----------------------------------------------------------------------------
// Workflow Status Mappings (Phase 5)
// ----------------------------------------------------------------------------

/**
 * Map Spanish Excel status values to database enum values
 * Supports both Spanish and English inputs (case-insensitive)
 */
export const WORKFLOW_STATUS_MAP: Record<string, string> = {
  activo: "ACTIVE",
  active: "ACTIVE",
  inactivo: "INACTIVE",
  inactive: "INACTIVE",
  eliminar: "DELETE",
  delete: "DELETE",
};

/**
 * Map database enum values to Spanish display values for Excel export
 */
export const WORKFLOW_STATUS_DISPLAY: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  DELETE: "Eliminar",
};
