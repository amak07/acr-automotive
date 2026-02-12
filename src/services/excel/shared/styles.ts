// ============================================================================
// Excel Styling Constants & Helpers
// ============================================================================

import ExcelJS from "exceljs";
import { SPANISH_HEADER_MAP } from "./constants";

/**
 * ACR Brand colors in ARGB format for ExcelJS
 * Soft pastel palette inspired by MercadoLibre's section-based approach
 */
export const EXCEL_COLORS = {
  // Soft pastels for group headers
  PASTEL_PEACH: "FFFCE4D6", // Part Information (soft salmon)
  PASTEL_MINT: "FFE2EFDA", // Cross-References (soft green)
  PASTEL_SKY: "FFDDEBF7", // Images (soft blue)
  PASTEL_LAVENDER: "FFE8E0F0", // Vehicle reference (soft purple)

  // Utility colors
  WHITE: "FFFFFFFF",
  LIGHT_GRAY: "FFF9F9F9", // Alternating rows
  BORDERS: "FFD9D9D9", // Softer borders
  TEXT_PRIMARY: "FF333333", // Softer black
  TEXT_SECONDARY: "FF666666", // Instructions text (gray)
  TEXT_LINK: "FF0066CC", // Hyperlinks (blue)
} as const;

/**
 * Row heights for consistent sizing
 */
export const ROW_HEIGHTS = {
  GROUP_HEADER: 32, // Taller for visual hierarchy
  COLUMN_HEADER: 24,
  INSTRUCTIONS: 40, // Taller for wrapping help text
  DATA_ROW: 18,
} as const;

/**
 * Column group definition for merged header cells
 */
export interface ColumnGroup {
  name: string;
  startCol: string; // Column header to start merge
  endCol: string; // Column header to end merge
  backgroundColor: string;
  fontColor?: string;
}

/**
 * Parts sheet column groups (3 logical sections)
 * Errors column sits outside groups intentionally
 */
export const PARTS_COLUMN_GROUPS: ColumnGroup[] = [
  {
    name: "Part Information",
    startCol: "ACR SKU",
    endCol: "Specifications",
    backgroundColor: EXCEL_COLORS.PASTEL_PEACH,
  },
  {
    name: "Cross-References",
    startCol: "National",
    endCol: "FAG",
    backgroundColor: EXCEL_COLORS.PASTEL_MINT,
  },
  {
    name: "Images",
    startCol: "Image URL Front",
    endCol: "360 Viewer",
    backgroundColor: EXCEL_COLORS.PASTEL_SKY,
  },
];

/**
 * Vehicle Applications sheet column groups (2 logical sections)
 */
export const VEHICLE_APPS_COLUMN_GROUPS: ColumnGroup[] = [
  {
    name: "Part Reference",
    startCol: "ACR SKU",
    endCol: "Status",
    backgroundColor: EXCEL_COLORS.PASTEL_PEACH,
  },
  {
    name: "Vehicle Information",
    startCol: "Make",
    endCol: "End Year",
    backgroundColor: EXCEL_COLORS.PASTEL_MINT,
  },
];

/**
 * Vehicle Aliases sheet column groups (1 logical section)
 */
export const ALIASES_COLUMN_GROUPS: ColumnGroup[] = [
  {
    name: "Alias Configuration",
    startCol: "Alias",
    endCol: "Status",
    backgroundColor: EXCEL_COLORS.PASTEL_PEACH,
  },
];

/**
 * Standard cell border style (thin gray)
 */
export const CELL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: EXCEL_COLORS.BORDERS } },
  left: { style: "thin", color: { argb: EXCEL_COLORS.BORDERS } },
  bottom: { style: "thin", color: { argb: EXCEL_COLORS.BORDERS } },
  right: { style: "thin", color: { argb: EXCEL_COLORS.BORDERS } },
};

/**
 * Apply styling to a group header cell (Row 1 - merged cells)
 */
export function applyGroupHeaderStyle(
  cell: ExcelJS.Cell,
  backgroundColor: string,
  fontColor: string = EXCEL_COLORS.TEXT_PRIMARY
): void {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: backgroundColor },
  };
  cell.font = {
    bold: true,
    size: 11,
    color: { argb: fontColor },
  };
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  cell.border = CELL_BORDER;
}

/**
 * Apply styling to a column header cell (Row 2)
 */
export function applyColumnHeaderStyle(cell: ExcelJS.Cell): void {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.WHITE },
  };
  cell.font = {
    bold: true,
    size: 10,
    color: { argb: EXCEL_COLORS.TEXT_PRIMARY },
  };
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  cell.border = {
    ...CELL_BORDER,
    bottom: { style: "medium", color: { argb: EXCEL_COLORS.BORDERS } },
  };
}

/**
 * Apply styling to a data row with alternating colors
 */
export function applyDataRowStyle(
  row: ExcelJS.Row,
  rowIndex: number,
  columnCount: number
): void {
  const isEvenRow = rowIndex % 2 === 0;
  const backgroundColor = isEvenRow
    ? EXCEL_COLORS.WHITE
    : EXCEL_COLORS.LIGHT_GRAY;

  for (let colIdx = 1; colIdx <= columnCount; colIdx++) {
    const cell = row.getCell(colIdx);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: backgroundColor },
    };
    cell.border = CELL_BORDER;
    cell.font = {
      size: 10,
      color: { argb: EXCEL_COLORS.TEXT_PRIMARY },
    };
    cell.alignment = {
      vertical: "middle",
    };
  }
}

/**
 * Column definition type (matches ExcelJS column structure)
 */
interface ColumnDefinition {
  header: string;
  key: string;
  width: number;
  hidden?: boolean;
}

/**
 * Add group header row (Row 1) with merged cells for logical column groupings
 *
 * This creates a visual hierarchy:
 * - Row 1: Group headers (merged cells spanning related columns)
 * - Row 2: Individual column headers
 * - Row 3+: Data rows
 */
export function addGroupHeaderRow(
  worksheet: ExcelJS.Worksheet,
  columns: ColumnDefinition[],
  groups: ColumnGroup[]
): void {
  // Build header-to-index map (ExcelJS uses 1-based indexing)
  const headerToIndex = new Map<string, number>();
  columns.forEach((col, idx) => {
    headerToIndex.set(col.header, idx + 1);
  });

  // Get Row 1 for group headers
  const groupHeaderRow = worksheet.getRow(1);
  groupHeaderRow.height = ROW_HEIGHTS.GROUP_HEADER;

  // Process each column group
  groups.forEach((group) => {
    const startIdx = headerToIndex.get(group.startCol);
    const endIdx = headerToIndex.get(group.endCol);

    if (!startIdx || !endIdx) {
      console.warn(
        `[Excel Styles] Could not find columns for group "${group.name}": ` +
          `startCol="${group.startCol}" (found: ${startIdx}), ` +
          `endCol="${group.endCol}" (found: ${endIdx})`
      );
      return;
    }

    // Set group name in the first cell of the range
    const startCell = groupHeaderRow.getCell(startIdx);
    startCell.value = group.name;

    // Merge cells if spanning multiple columns
    if (startIdx !== endIdx) {
      worksheet.mergeCells(1, startIdx, 1, endIdx);
    }

    // Apply styling to the merged cell
    applyGroupHeaderStyle(
      startCell,
      group.backgroundColor,
      group.fontColor || EXCEL_COLORS.TEXT_PRIMARY
    );
  });
}

/**
 * Add column header row (Row 2) with styling
 * When locale is "es", uses Spanish header names from SPANISH_HEADER_MAP
 */
export function addColumnHeaderRow(
  worksheet: ExcelJS.Worksheet,
  columns: ColumnDefinition[],
  locale: "en" | "es" = "en"
): void {
  const headerRow = worksheet.getRow(2);
  headerRow.height = ROW_HEIGHTS.COLUMN_HEADER;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = locale === "es"
      ? (SPANISH_HEADER_MAP[col.key] || col.header)
      : col.header;
    applyColumnHeaderStyle(cell);
  });
}

// ============================================================================
// Instructions Row Content (Bilingual)
// ============================================================================

/**
 * Instruction content for a column - can be text or hyperlink
 */
export type InstructionContent =
  | string
  | { text: string; link: string }
  | undefined;

/**
 * Parts sheet instructions (Row 3) - bilingual
 * Provides help text for each column in both English and Spanish
 */
export const PARTS_INSTRUCTIONS: Record<
  "en" | "es",
  Record<string, InstructionContent>
> = {
  en: {
    // Part Information
    "ACR SKU": "Unique ID. Do not modify.",
    Status: "Activo, Inactivo, or Eliminar",
    "Part Type": "MAZA, ROTOR, etc.",
    Position: "FRONT, REAR",
    "ABS Type": "W/ABS, W/O ABS, etc.",
    "Bolt Pattern": "4 BOLTS, 5 BOLTS, etc.",
    "Drive Type": "4x2, 4x4, etc.",
    Specifications: "Additional specs",

    // Cross-References (all same instruction)
    National: "Multiple SKUs: separate with ;",
    ATV: "Multiple SKUs: separate with ;",
    SYD: "Multiple SKUs: separate with ;",
    TMK: "Multiple SKUs: separate with ;",
    GROB: "Multiple SKUs: separate with ;",
    RACE: "Multiple SKUs: separate with ;",
    OEM: "Multiple SKUs: separate with ;",
    OEM_2: "Multiple SKUs: separate with ;",
    GMB: "Multiple SKUs: separate with ;",
    GSP: "Multiple SKUs: separate with ;",
    FAG: "Multiple SKUs: separate with ;",

    // Images - with clickable hyperlink
    "Image URL Front": {
      text: "Upload via Photo Manager",
      link: "/admin/upload-images",
    },
    "Image URL Back": {
      text: "Upload via Photo Manager",
      link: "/admin/upload-images",
    },
    "Image URL Top": {
      text: "Upload via Photo Manager",
      link: "/admin/upload-images",
    },
    "Image URL Other": {
      text: "Upload via Photo Manager",
      link: "/admin/upload-images",
    },
    "360 Viewer": {
      text: "Manage in Data Portal",
      link: "/data-portal/360-viewer",
    },
    Errors: "Do not modify (auto formula)",
  },
  es: {
    // Part Information
    "ACR SKU": "ID único. No modificar.",
    Status: "Activo, Inactivo o Eliminar",
    "Part Type": "MAZA, ROTOR, etc.",
    Position: "DELANTERA, TRASERA",
    "ABS Type": "C/ABS, S/ABS, etc.",
    "Bolt Pattern": "4 BIRLOS, 5 BIRLOS, etc.",
    "Drive Type": "4x2, 4x4, etc.",
    Specifications: "Especificaciones adicionales",

    // Cross-References (all same instruction)
    National: "Múltiples SKUs: separar con ;",
    ATV: "Múltiples SKUs: separar con ;",
    SYD: "Múltiples SKUs: separar con ;",
    TMK: "Múltiples SKUs: separar con ;",
    GROB: "Múltiples SKUs: separar con ;",
    RACE: "Múltiples SKUs: separar con ;",
    OEM: "Múltiples SKUs: separar con ;",
    OEM_2: "Múltiples SKUs: separar con ;",
    GMB: "Múltiples SKUs: separar con ;",
    GSP: "Múltiples SKUs: separar con ;",
    FAG: "Múltiples SKUs: separar con ;",

    // Images - with clickable hyperlink
    "Image URL Front": {
      text: "Subir en Administrador de Fotos",
      link: "/admin/upload-images",
    },
    "Image URL Back": {
      text: "Subir en Administrador de Fotos",
      link: "/admin/upload-images",
    },
    "Image URL Top": {
      text: "Subir en Administrador de Fotos",
      link: "/admin/upload-images",
    },
    "Image URL Other": {
      text: "Subir en Administrador de Fotos",
      link: "/admin/upload-images",
    },
    "360 Viewer": {
      text: "Administrar en Portal de Datos",
      link: "/data-portal/360-viewer",
    },
    Errors: "No modificar (fórmula automática)",
  },
};

/**
 * Vehicle Applications sheet instructions (Row 3) - bilingual
 */
export const VEHICLE_APPS_INSTRUCTIONS: Record<
  "en" | "es",
  Record<string, InstructionContent>
> = {
  en: {
    "ACR SKU": "Part identifier",
    Status: "Activo or Eliminar",
    Make: "e.g., CHEVROLET, FORD",
    Model: "e.g., SILVERADO, F-150",
    "Start Year": "First year of fitment",
    "End Year": "Last year of fitment",
    Errors: "Do not modify (auto formula)",
  },
  es: {
    "ACR SKU": "Identificador de parte",
    Status: "Activo o Eliminar",
    Make: "ej., CHEVROLET, FORD",
    Model: "ej., SILVERADO, F-150",
    "Start Year": "Primer año de aplicación",
    "End Year": "Último año de aplicación",
    Errors: "No modificar (fórmula automática)",
  },
};

/**
 * Vehicle Aliases sheet instructions (Row 3) - bilingual
 */
export const ALIASES_INSTRUCTIONS: Record<
  "en" | "es",
  Record<string, InstructionContent>
> = {
  en: {
    Alias: "Nickname or alternate name",
    "Canonical Name": "Official name to map to",
    Type: "make or model",
    Status: "Activo or Eliminar",
    Errors: "Do not modify (auto formula)",
  },
  es: {
    Alias: "Apodo o nombre alternativo",
    "Canonical Name": "Nombre oficial a mapear",
    Type: "make o model",
    Status: "Activo o Eliminar",
    Errors: "No modificar (fórmula automática)",
  },
};

/**
 * Apply styling to an instructions row cell (Row 3)
 */
export function applyInstructionsRowStyle(
  cell: ExcelJS.Cell,
  isHyperlink: boolean = false
): void {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.WHITE },
  };

  if (isHyperlink) {
    cell.font = {
      italic: true,
      size: 9,
      color: { argb: EXCEL_COLORS.TEXT_LINK },
      underline: true,
    };
  } else {
    cell.font = {
      italic: true,
      size: 9,
      color: { argb: EXCEL_COLORS.TEXT_SECONDARY },
    };
  }

  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  cell.border = CELL_BORDER;
}

/**
 * Add instructions row (Row 3) with help text for each column
 *
 * @param worksheet - The worksheet to add instructions to
 * @param columns - Column definitions
 * @param instructions - Bilingual instruction content for each column
 * @param baseUrl - Base URL for hyperlinks (e.g., "http://localhost:3000")
 */
export function addInstructionsRow(
  worksheet: ExcelJS.Worksheet,
  columns: ColumnDefinition[],
  instructions: Record<string, InstructionContent>,
  baseUrl: string = ""
): void {
  const instructionsRow = worksheet.getRow(3);
  instructionsRow.height = ROW_HEIGHTS.INSTRUCTIONS;

  columns.forEach((col, idx) => {
    const cell = instructionsRow.getCell(idx + 1);
    // Look up by header first, then by key (handles Spanish headers with English-keyed instructions)
    const instruction = instructions[col.header] ?? instructions[col.key];

    if (typeof instruction === "object" && instruction?.link) {
      // Clickable hyperlink
      const fullUrl = baseUrl + instruction.link;
      cell.value = { text: instruction.text, hyperlink: fullUrl };
      applyInstructionsRowStyle(cell, true);
    } else if (typeof instruction === "string" && instruction) {
      // Plain text instruction
      cell.value = instruction;
      applyInstructionsRowStyle(cell, false);
    } else {
      // Empty cell (for hidden columns)
      cell.value = "";
      applyInstructionsRowStyle(cell, false);
    }
  });
}
