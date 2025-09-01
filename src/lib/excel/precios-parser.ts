import * as XLSX from "xlsx";
import {
  PreciosRow,
  PreciosResult,
  CrossReference,
  PRECIOS_COLUMNS,
  EXCEL_STRUCTURE,
  competitorBrands,
} from "./types";

/**
 * Simplified PRECIOS Parser for One-Time Bootstrap Import
 * 
 * Input: LISTA DE PRECIOS Excel file
 * Output: ACR SKUs + Cross-references
 * No complex validation - just parse and log issues
 */
export class PreciosParser {
  /**
   * Parse PRECIOS Excel file - SIMPLIFIED
   */
  static parseFile(fileBuffer: ArrayBuffer | Buffer): PreciosResult {
    console.log("🔍 Starting PRECIOS parsing...");
    const startTime = Date.now();

    try {
      // Read Excel file
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extract data rows (skip header rows 1-8)
      const rawRows = this.extractDataRows(worksheet);
      console.log(`📄 Found ${rawRows.length} data rows`);

      // Parse into structured data
      const preciosRows = this.parseRows(rawRows);
      console.log(`✅ Parsed ${preciosRows.length} valid rows`);

      // Transform to cross-references
      const crossReferences = this.transformToCrossReferences(preciosRows);
      console.log(`🔗 Generated ${crossReferences.length} cross-references`);

      // Extract unique ACR SKUs
      const acrSkus = this.extractAcrSkus(preciosRows);
      console.log(`🏷️  Found ${acrSkus.size} unique ACR SKUs`);

      const processingTime = Date.now() - startTime;
      console.log(`⚡ PRECIOS parsing completed in ${processingTime}ms`);

      return {
        acrSkus,
        crossReferences,
        summary: {
          totalParts: acrSkus.size,
          totalCrossReferences: crossReferences.length,
          processingTimeMs: processingTime,
        },
      };

    } catch (error) {
      console.error("❌ PRECIOS parsing failed:", error);
      throw new Error(`PRECIOS parsing failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Extract data rows from Excel worksheet
   */
  private static extractDataRows(worksheet: XLSX.WorkSheet): any[][] {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const rows: any[][] = [];

    // Data starts at row 9 (header at row 8)
    for (let row = EXCEL_STRUCTURE.PRECIOS.DATA_START_ROW - 1; row <= range.e.r; row++) {
      const rowData: any[] = [];
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData[col] = cell ? cell.v : null;
      }
      
      // Skip empty rows
      const hasData = rowData.some(cell => cell !== null && cell !== undefined && cell !== '');
      if (hasData) {
        rows.push(rowData);
      }
    }

    return rows;
  }

  /**
   * Parse raw rows into PreciosRow objects
   */
  private static parseRows(rawRows: any[][]): PreciosRow[] {
    const validRows: PreciosRow[] = [];
    
    rawRows.forEach((row, index) => {
      const acrSku = row[PRECIOS_COLUMNS.ACR_SKU - 1]?.toString()?.trim();
      
      // Skip rows without ACR SKU
      if (!acrSku) {
        return;
      }

      validRows.push({
        rowNumber: index + EXCEL_STRUCTURE.PRECIOS.DATA_START_ROW,
        acrSku,
        // @ts-ignore - Simplified parser uses object format instead of array
        competitors: {
          // @ts-ignore - Object format for simplified one-time import
          NATIONAL: row[PRECIOS_COLUMNS.NATIONAL - 1]?.toString()?.trim() || '',
          ATV: row[PRECIOS_COLUMNS.ATV - 1]?.toString()?.trim() || '',
          SYD: row[PRECIOS_COLUMNS.SYD - 1]?.toString()?.trim() || '',
          TMK: row[PRECIOS_COLUMNS.TMK - 1]?.toString()?.trim() || '',
          GROB: row[PRECIOS_COLUMNS.GROB - 1]?.toString()?.trim() || '',
          RACE: row[PRECIOS_COLUMNS.RACE - 1]?.toString()?.trim() || '',
          OEM: row[PRECIOS_COLUMNS.OEM - 1]?.toString()?.trim() || '',
          OEM2: row[PRECIOS_COLUMNS.OEM2 - 1]?.toString()?.trim() || '',
          GMB: row[PRECIOS_COLUMNS.GMB - 1]?.toString()?.trim() || '',
          GSP: row[PRECIOS_COLUMNS.GSP - 1]?.toString()?.trim() || '',
          FAG: row[PRECIOS_COLUMNS.FAG - 1]?.toString()?.trim() || '',
        }
      });
    });
    
    return validRows;
  }

  /**
   * Transform parsed rows into cross-references
   */
  private static transformToCrossReferences(preciosRows: PreciosRow[]): CrossReference[] {
    const crossReferences: CrossReference[] = [];

    preciosRows.forEach(row => {
      // Process each competitor brand
      // @ts-ignore - Simplified parser uses object format
      Object.entries(row.competitors).forEach(([brand, sku]) => {
        // @ts-ignore - sku is string in simplified format
        if (sku && sku.trim() !== '') {
          // Skip very long SKUs (likely data entry errors)
          // @ts-ignore - sku is string in simplified format
          if (sku.length > 50) {
            // @ts-ignore - sku is string in simplified format
            console.warn(`⚠️  Skipping long SKU: ${sku.substring(0, 30)}...`);
            return;
          }

          crossReferences.push({
            acrSku: row.acrSku,
            // @ts-ignore - sku is string in simplified format
            competitorSku: sku,
            competitorBrand: brand
          });
        }
      });
    });

    return crossReferences;
  }

  /**
   * Extract unique ACR SKUs
   */
  private static extractAcrSkus(preciosRows: PreciosRow[]): Set<string> {
    return new Set(preciosRows.map(row => row.acrSku));
  }
}