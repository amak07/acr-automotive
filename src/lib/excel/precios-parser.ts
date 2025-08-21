import * as XLSX from "xlsx";
import {
  PreciosRow,
  PreciosResult,
  CrossReference,
  PRECIOS_COLUMNS,
  EXCEL_STRUCTURE,
  competitorBrands,
} from "./types";
import {
  ConflictReport,
  ProcessingResult,
  CONFLICT_TYPES,
} from "./conflict-types";
import { randomUUID } from "crypto";

/**
 * Parser for LISTA DE PRECIOS Excel file
 * Column B = ACR SKU, Columns C-M = competitor brands
 */
export class PreciosParser {
  /**
   * Parse PRECIOS Excel file
   */
  static parseFile(
    fileBuffer: ArrayBuffer | Buffer
  ): ProcessingResult<PreciosResult> {
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

      const conflicts: ConflictReport[] = [];
      const duplicateSkuConflicts = this.detectDuplicateAcrSkus(preciosRows);
      conflicts.push(...duplicateSkuConflicts);

      const hasBlockingConflicts = conflicts.some(
        (c) => c.impact === "blocking"
      );

      if (!hasBlockingConflicts) {
        const preciosResult: PreciosResult = {
          acrSkus,
          crossReferences,
          summary: {
            totalParts: acrSkus.size,
            totalCrossReferences: crossReferences.length,
            processingTimeMs: Date.now() - startTime,
          },
        };

        return {
          success: true,
          data: preciosResult,
          conflicts,
          summary: {
            processingTimeMs: Date.now() - startTime,
            totalRows: rawRows.length,
            validRecords: preciosRows.length,
            skippedRows: 0,
            conflictCounts: {
              errors: conflicts.filter((c) => c.severity === "error").length,
              warnings: conflicts.filter((c) => c.severity === "warning")
                .length,
              info: conflicts.filter((c) => c.severity === "info").length,
            },
          },
          canProceed: true,
        };
      } else {
        return {
          success: false,
          data: undefined,
          conflicts,
          summary: {
            processingTimeMs: Date.now() - startTime,
            totalRows: rawRows.length,
            validRecords: 0,
            skippedRows: rawRows.length,
            conflictCounts: {
              errors: conflicts.filter((c) => c.severity === "error").length,
              warnings: conflicts.filter((c) => c.severity === "warning")
                .length,
              info: conflicts.filter((c) => c.severity === "info").length,
            },
          },
          canProceed: false,
        };
      }
    } catch (error) {
      throw new Error(`Failed to parse PRECIOS file: ${error}`);
    }
  }

  /**
   * Extract data rows from worksheet, skipping header rows
   */
  private static extractDataRows(worksheet: XLSX.WorkSheet): any[][] {
    const range = worksheet["!ref"];
    if (!range) {
      return [];
    }

    const worksheetRange = XLSX.utils.decode_range(range);
    const endRow = worksheetRange.e.r + 1;

    const data = XLSX.utils.sheet_to_json(worksheet, {
      range: `A${EXCEL_STRUCTURE.PRECIOS.DATA_START_ROW}:M${endRow}`,
      header: 1,
    });

    return data as any[][];
  }

  /**
   * Parse raw Excel rows into typed PreciosRow objects
   */
  private static parseRows(rawRows: any[][]): PreciosRow[] {
    const preciosRows: PreciosRow[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = EXCEL_STRUCTURE.PRECIOS.DATA_START_ROW + i;

      try {
        const preciosRow = this.parseRow(row, rowNumber);
        if (preciosRow) {
          preciosRows.push(preciosRow);
        }
      } catch (error) {
        continue;
      }
    }

    return preciosRows;
  }

  /**
   * Parse a single Excel row into PreciosRow
   */
  private static parseRow(row: any[], rowNumber: number): PreciosRow | null {
    const acrSku = row[PRECIOS_COLUMNS.ACR_SKU - 1];

    if (!acrSku || typeof acrSku !== "string") {
      return null;
    }

    if (!this.isValidAcrSku(acrSku.trim())) {
      return null;
    }

    const competitors = this.extractCompetitorSkus(row);

    return {
      acrSku: acrSku.trim(),
      competitors,
      rowNumber,
    };
  }

  /**
   * Extract competitor SKUs from a single row
   */
  private static extractCompetitorSkus(
    row: any[]
  ): Array<{ brand: string; sku: string | null }> {
    const competitors: Array<{ brand: string; sku: string | null }> = [];

    for (let i = PRECIOS_COLUMNS.NATIONAL; i <= PRECIOS_COLUMNS.FAG; i++) {
      const cellValue = row[i - 1];
      const brandName =
        competitorBrands.find((item) => item.column === i)?.brand || "";

      let competitorSku: string | null = null;
      if (cellValue && typeof cellValue === "string") {
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
   */
  private static transformToCrossReferences(
    preciosRows: PreciosRow[]
  ): CrossReference[] {
    const crossReferences: CrossReference[] = [];

    for (const row of preciosRows) {
      for (const competitor of row.competitors) {
        if (competitor.sku) {
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
   */
  private static extractAcrSkus(preciosRows: PreciosRow[]): Set<string> {
    const acrSKUs: Set<string> = new Set(
      preciosRows
        .filter((item) => this.isValidAcrSku(item.acrSku))
        .map((item) => item.acrSku)
    );
    return acrSKUs;
  }

  /**
   * Validate ACR SKU format (should start with "ACR")
   */
  private static isValidAcrSku(sku: string): boolean {
    return sku.startsWith("ACR");
  }

  /**
   * Detect duplicate ACR SKUs (BLOCKING ERROR)
   */
  private static detectDuplicateAcrSkus(
    preciosRows: PreciosRow[]
  ): ConflictReport[] {
    const validAcrSkus = new Set<string>();
    const duplicateAcrSkus: ConflictReport[] = [];

    for (const row of preciosRows) {
      if (validAcrSkus.has(row.acrSku)) {
        const conflict: ConflictReport = {
          id: randomUUID(),
          affectedRows: [row.rowNumber],
          affectedSkus: [row.acrSku],
          description: `Duplicate ACR_SKU detected. ${row.acrSku} already exists.`,
          impact: "blocking",
          conflictType: CONFLICT_TYPES.DUPLICATE_ACR_SKU,
          severity: "error",
          source: "precios",
          suggestion:
            "Remove the duplicate ACR_SKU from the PRECIOS excel file.",
        };
        duplicateAcrSkus.push(conflict);
      } else {
        validAcrSkus.add(row.acrSku);
      }
    }

    return duplicateAcrSkus;
  }
}
