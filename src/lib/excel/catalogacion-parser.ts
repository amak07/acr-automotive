import * as XLSX from "xlsx";
import {
  CATALOGACION_COLUMNS,
  CatalogacionResult,
  CatalogacionRow,
  EXCEL_STRUCTURE,
  PartData,
  VehicleApplication,
} from "./types";

/**
 * Simplified CATALOGACION Parser for One-Time Bootstrap Import
 *
 * Input: CATALOGACION ACR CLIENTES Excel file + Valid ACR SKUs from PRECIOS
 * Output: Part details + Vehicle applications
 * No complex validation - just parse and log orphaned SKUs
 */
export class CatalogacionParser {
  /**
   * Parse CATALOGACION Excel file - SIMPLIFIED
   */
  static parseFile(
    fileBuffer: ArrayBuffer | Buffer,
    validAcrSkus: Set<string>
  ): CatalogacionResult {
    console.log("🔍 Starting CATALOGACION parsing...");
    const startTime = Date.now();

    try {
      // Read Excel file
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extract data rows (skip header row 1)
      const rawRows = this.extractDataRows(worksheet);
      console.log(`📄 Found ${rawRows.length} data rows`);

      // Parse into structured data
      const catalogacionRows = this.parseRows(rawRows);
      console.log(`✅ Parsed ${catalogacionRows.length} valid rows`);

      // Separate valid vs orphaned SKUs
      const { valid, orphaned } = this.validateAcrSkus(
        catalogacionRows,
        validAcrSkus
      );
      console.log(`🔗 Valid: ${valid.length}, Orphaned: ${orphaned.length}`);

      if (orphaned.length > 0) {
        console.warn(
          `⚠️  Found ${orphaned.length} orphaned ACR SKUs:`,
          orphaned
        );
      }

      // Generate part data and vehicle applications from valid rows
      const parts = this.extractPartData(valid);
      const applications = this.extractVehicleApplications(valid);

      const processingTime = Date.now() - startTime;
      console.log(`⚡ CATALOGACION parsing completed in ${processingTime}ms`);

      return {
        parts,
        applications,
        orphanedApplications: orphaned,
        summary: {
          totalParts: parts.length,
          totalApplications: applications.length,
          orphanedCount: orphaned.length,
          processingTimeMs: processingTime,
        },
      };
    } catch (error) {
      console.error("❌ CATALOGACION parsing failed:", error);
      throw new Error(
        `CATALOGACION parsing failed: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /**
   * Extract data rows from Excel worksheet
   */
  private static extractDataRows(worksheet: XLSX.WorkSheet): any[][] {
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    const rows: any[][] = [];

    // Data starts at row 2 (header at row 1)
    for (
      let row = EXCEL_STRUCTURE.CATALOGACION.DATA_START_ROW - 1;
      row <= range.e.r;
      row++
    ) {
      const rowData: any[] = [];

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData[col] = cell ? cell.v : null;
      }

      // Skip empty rows
      const hasData = rowData.some(
        (cell) => cell !== null && cell !== undefined && cell !== ""
      );
      if (hasData) {
        rows.push(rowData);
      }
    }

    return rows;
  }

  private static parseYearRange(yearString: string | null): {
    startYear: string | null;
    endYear: string | null;
  } {
    if (!yearString) return { startYear: null, endYear: null };

    const cleanYear = yearString.toString().trim();
    if (!cleanYear) return { startYear: null, endYear: null };

    if (cleanYear.includes("-")) {
      // Range format: "2012-2019"
      const parts = cleanYear.split("-");
      return {
        startYear: parts[0]?.trim() || null,
        endYear: parts[1]?.trim() || null,
      };
    } else {
      // Single year: "2015"
      return { startYear: cleanYear, endYear: cleanYear };
    }
  }

  /**
   * Parse raw rows into CatalogacionRow objects
   */
  private static parseRows(rawRows: any[][]): CatalogacionRow[] {
    const validRows: CatalogacionRow[] = [];

    rawRows.forEach((row, index) => {
      const acrSku = row[CATALOGACION_COLUMNS.ACR_SKU - 1]?.toString()?.trim();
      const yearData = this.parseYearRange(row[CATALOGACION_COLUMNS.YEAR - 1]);

      // Skip rows without ACR SKU
      if (!acrSku) {
        return;
      }

      validRows.push({
        rowNumber: index + EXCEL_STRUCTURE.CATALOGACION.DATA_START_ROW,
        acrSku,
        partType:
          row[CATALOGACION_COLUMNS.PART_TYPE - 1]?.toString()?.trim() || "",
        position:
          row[CATALOGACION_COLUMNS.POSICION - 1]?.toString()?.trim() || "",
        absType:
          row[CATALOGACION_COLUMNS.SISTEMA - 1]?.toString()?.trim() || "",
        boltPattern:
          row[CATALOGACION_COLUMNS.BIRLOS - 1]?.toString()?.trim() || "",
        driveType:
          row[CATALOGACION_COLUMNS.TRACCION - 1]?.toString()?.trim() || "",
        specifications:
          row[CATALOGACION_COLUMNS.OBSERVACIONES - 1]?.toString()?.trim() || "",
        make: row[CATALOGACION_COLUMNS.MAKE - 1]?.toString()?.trim() || "",
        model: row[CATALOGACION_COLUMNS.MODEL - 1]?.toString()?.trim() || "",
        startYear: yearData.startYear || "",
        endYear: yearData.endYear || "",
      });
    });

    return validRows;
  }

  /**
   * Validate ACR SKUs against PRECIOS master list
   */
  private static validateAcrSkus(
    catalogacionRows: CatalogacionRow[],
    validAcrSkus: Set<string>
  ): { valid: CatalogacionRow[]; orphaned: string[] } {
    const valid: CatalogacionRow[] = [];
    const orphanedSet = new Set<string>();

    catalogacionRows.forEach((row) => {
      if (validAcrSkus.has(row.acrSku)) {
        valid.push(row);
      } else {
        orphanedSet.add(row.acrSku);
      }
    });

    return { valid, orphaned: Array.from(orphanedSet) };
  }

  /**
   * Extract part data from valid rows
   */
  private static extractPartData(validRows: CatalogacionRow[]): PartData[] {
    // Group by ACR SKU and take first occurrence for each
    const partMap = new Map<string, PartData>();

    validRows.forEach((row) => {
      if (!partMap.has(row.acrSku)) {
        partMap.set(row.acrSku, {
          acrSku: row.acrSku,
          partType: row.partType,
          position: row.position,
          absType: row.absType,
          boltPattern: row.boltPattern,
          driveType: row.driveType,
          specifications: row.specifications,
          firstSeenAtRow: row.rowNumber,
        });
      }
    });

    return Array.from(partMap.values());
  }

  /**
   * Extract vehicle applications from valid rows
   */
  private static extractVehicleApplications(
    validRows: CatalogacionRow[]
  ): VehicleApplication[] {
    return validRows
      .filter((row) => row.make && row.model && row.startYear && row.endYear) // Only rows with vehicle data
      .map((row) => ({
        acrSku: row.acrSku,
        make: row.make,
        model: row.model,
        startYear: Number(row.startYear),
        endYear: Number(row.endYear),
        rowNumber: row.rowNumber,
      }));
  }
}
