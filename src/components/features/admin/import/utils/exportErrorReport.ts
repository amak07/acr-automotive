import ExcelJS from "exceljs";

interface ValidationError {
  code: string;
  severity: "error" | "warning";
  message: string;
  sheet?: string;
  row?: number;
  column?: string;
  value?: any;
}

/**
 * Generates and downloads an Excel error report from validation errors.
 * Mercado Libre pattern: summary sheet with row numbers for cross-referencing.
 *
 * Columns: Sheet | Row | Column | Error Code | Description | Value
 */
export async function exportErrorReport(
  errors: ValidationError[],
  originalFileName: string
): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Error Report");

    // Header row with styling
    const headerRow = worksheet.addRow([
      "Sheet",
      "Row",
      "Column",
      "Error Code",
      "Description",
      "Value",
    ]);

    // Style headers
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFED1C24" }, // ACR Red
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
        size: 11,
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    // Set column widths
    worksheet.columns = [
      { key: "sheet", width: 25 },
      { key: "row", width: 8 },
      { key: "column", width: 20 },
      { key: "code", width: 30 },
      { key: "description", width: 60 },
      { key: "value", width: 30 },
    ];

    // Group errors by sheet and sort by row
    const sortedErrors = [...errors].sort((a, b) => {
      const sheetCompare = (a.sheet || "General").localeCompare(
        b.sheet || "General"
      );
      if (sheetCompare !== 0) return sheetCompare;
      return (a.row || 0) - (b.row || 0);
    });

    // Add error rows
    sortedErrors.forEach((error) => {
      const row = worksheet.addRow([
        error.sheet || "General",
        error.row || "\u2014",
        error.column || "\u2014",
        error.code,
        error.message,
        error.value !== undefined ? String(error.value) : "\u2014",
      ]);

      // Light red background for error rows
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF5F5" }, // Very light red
        };
        cell.border = {
          bottom: { style: "hair", color: { argb: "FFEEEEEE" } },
        };
        cell.alignment = { vertical: "top", wrapText: true };
      });
    });

    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Auto-filter on headers
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 6 },
    };

    // Generate file and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseName = originalFileName.replace(/\.xlsx$/i, "");
    link.href = url;
    link.download = `${baseName}-errors.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate error report:", error);
    throw error;
  }
}
