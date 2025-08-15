// PRECIOS Excel Parser - ACR Automotive
// Parses cross-reference mappings from LISTA DE PRECIOS Excel file
import * as XLSX from "xlsx";
import {
  PreciosRow,
  PreciosResult,
  CrossReference,
  ParseError,
  PRECIOS_COLUMNS,
  EXCEL_STRUCTURE,
  competitorBrands,
} from "./types";

/**
 * Parser for LISTA DE PRECIOS Excel file
 *
 * Business Logic:
 * - File contains ACR SKUs and their competitor equivalents
 * - Header row is at row 8, data starts at row 9
 * - Column B = ACR SKU, Columns C-M = competitor brands
 * - Empty cells = no equivalent part for that competitor
 */
export class PreciosParser {
  /**
   * Main entry point - parses PRECIOS Excel file
   *
   * @param fileBuffer - Raw Excel file buffer
   * @returns PreciosResult with ACR SKUs and cross-references
   */
  static parseFile(fileBuffer: ArrayBuffer | Buffer): PreciosResult {
    const startTime = Date.now();

    try {
      // Read Excel file with XLSX - XLSX can handle both ArrayBuffer and Buffer
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extract data range (skip header rows)
      const rawRows = this.extractDataRows(worksheet);

      // Parse each row into PreciosRow
      const preciosRows = this.parseRows(rawRows);

      // Transform into cross-references
      const crossReferences = this.transformToCrossReferences(preciosRows);

      // Extract unique ACR SKUs
      const acrSkus = this.extractAcrSkus(preciosRows);

      return {
        acrSkus,
        crossReferences,
        summary: {
          totalParts: acrSkus.size,
          totalCrossReferences: crossReferences.length,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse PRECIOS file: ${error}`);
    }
  }

  /**
   * Extract data rows from worksheet, skipping header rows
   *
   * @param worksheet - XLSX worksheet object
   * @returns Array of raw Excel rows (arrays of cell values)
   */
  private static extractDataRows(worksheet: XLSX.WorkSheet): any[][] {
    // Get worksheet range to understand the data boundaries
    // Also checks for undefined, or corrupted, worksheet.
    const range = worksheet["!ref"];
    if (!range) {
      return []; // Empty worksheet
    }

    // Start from DATA_START_ROW (row 9)
    // Get array of arrays starting from row 9, columns A to M
    // Need to specify end row - use the worksheet range
    const worksheetRange = XLSX.utils.decode_range(range);
    const endRow = worksheetRange.e.r + 1; // Convert 0-based to 1-based
    
    const data = XLSX.utils.sheet_to_json(worksheet, {
      range: `A${EXCEL_STRUCTURE.PRECIOS.DATA_START_ROW}:M${endRow}`,
      header: 1,
    });

    return data as any[][];
  }

  /**
   * Parse raw Excel rows into typed PreciosRow objects
   *
   * @param rawRows - Array of raw Excel rows
   * @returns Array of typed PreciosRow objects
   */
  private static parseRows(rawRows: any[][]): PreciosRow[] {
    const preciosRows: PreciosRow[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = EXCEL_STRUCTURE.PRECIOS.DATA_START_ROW + i;

      try {
        // Parse single row
        const preciosRow = this.parseRow(row, rowNumber);
        if (preciosRow) {
          preciosRows.push(preciosRow);
        }
      } catch (error) {
        // Skip invalid rows silently in production
        continue;
      }
    }

    return preciosRows;
  }

  /**
   * Parse a single Excel row into PreciosRow
   *
   * @param row - Raw Excel row (array of cell values)
   * @param rowNumber - Excel row number for error reporting
   * @returns PreciosRow object or null if row should be skipped
   */
  private static parseRow(row: any[], rowNumber: number): PreciosRow | null {
    // Extract ACR SKU from column B
    const acrSku = row[PRECIOS_COLUMNS.ACR_SKU - 1]; // Convert 1-based to 0-based

    // Skip empty rows or rows without ACR SKU
    if (!acrSku || typeof acrSku !== "string") {
      return null;
    }

    // Skip rows with invalid ACR SKU format
    if (!this.isValidAcrSku(acrSku.trim())) {
      return null;
    }

    // Extract competitor SKUs from columns C-M
    const competitors = this.extractCompetitorSkus(row);

    return {
      acrSku: acrSku.trim(),
      competitors,
      rowNumber,
    };
  }

  /**
   * Extract competitor SKUs from a single row
   *
   * @param row - Raw Excel row
   * @returns Array of competitor mappings
   */
  private static extractCompetitorSkus(
    row: any[]
  ): Array<{ brand: string; sku: string | null }> {
    const competitors: Array<{ brand: string; sku: string | null }> = [];

    // Iterate through competitor columns (C-M)
    // Use PRECIOS_COLUMNS to get brand names and column positions
    // Handle empty cells as null

    for (let i = PRECIOS_COLUMNS.NATIONAL; i <= PRECIOS_COLUMNS.FAG; i++) {
      const cellValue = row[i - 1]; // Convert 1-based to 0-based index
      const brandName = competitorBrands.find((item) => item.column === i)?.brand || "";
      
      // Safely handle empty/undefined cells
      let competitorSku: string | null = null;
      if (cellValue && typeof cellValue === 'string') {
        const trimmed = cellValue.trim();
        competitorSku = trimmed.length > 0 ? trimmed : null;
      }

      competitors.push({
        brand: brandName,
        sku: competitorSku,
      });
    }

    return competitors;
  }

  /**
   * Transform PreciosRow objects into CrossReference objects
   *
   * @param preciosRows - Array of parsed PRECIOS rows
   * @returns Array of cross-reference mappings
   */
  private static transformToCrossReferences(
    preciosRows: PreciosRow[]
  ): CrossReference[] {
    const crossReferences: CrossReference[] = [];

    for (const row of preciosRows) {
      // For each competitor with non-null SKU, create CrossReference
      for (const competitor of row.competitors) {
        if (competitor.sku) {
          // Create CrossReference object
          crossReferences.push({
            acrSku: row.acrSku,
            competitorBrand: competitor.brand,
            competitorSku: competitor.sku,
          });
        }
      }
    }

    return crossReferences;
  }

  /**
   * Extract unique ACR SKUs from parsed rows
   *
   * @param preciosRows - Array of parsed PRECIOS rows
   * @returns Set of unique ACR SKUs
   */
  private static extractAcrSkus(preciosRows: PreciosRow[]): Set<string> {
    // Create Set from all valid ACR SKUs
    // This becomes the "master list" of available parts
    const acrSKUs: Set<string> = new Set(
      preciosRows
        .filter((item) => this.isValidAcrSku(item.acrSku))
        .map((item) => item.acrSku)
    );
    return acrSKUs;
  }

  /**
   * Validate ACR SKU format (should start with "ACR")
   *
   * @param sku - SKU to validate
   * @returns true if valid format
   */
  private static isValidAcrSku(sku: string): boolean {
    // Check if SKU starts with "ACR"
    return sku.startsWith("ACR");
  }
}
