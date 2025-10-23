import ExcelJS from 'exceljs';
import { supabase } from '@/lib/supabase/client';

/**
 * ExcelExportService
 *
 * Handles Excel export of all catalog data in standardized 3-sheet format.
 * Uses ExcelJS library for full Excel feature support including hidden columns.
 *
 * Sheet Structure:
 * 1. Parts - All parts with hidden ID columns
 * 2. Vehicle Applications - Vehicle fitment data
 * 3. Cross References - Competitor cross-references
 *
 * Hidden Columns (for import matching):
 * - _id: Record UUID (hidden)
 * - _tenant_id: Tenant UUID (hidden, NULL for MVP)
 * - _part_id: Foreign key reference (hidden, for VAs and CRs)
 *
 * Export-Import Loop:
 * 1. User exports to get IDs
 * 2. User edits data in Excel
 * 3. User imports - system matches by ID and applies changes
 */
export class ExcelExportService {
  /**
   * Fetch all rows from a table using pagination
   *
   * PostgREST has a server-side max-rows limit (default 1000).
   * This method paginates through all results using range queries.
   *
   * @param tableName - Table to query
   * @param orderBy - ORDER BY clause
   * @returns All rows from the table
   */
  private async fetchAllRows(tableName: string, orderBy: string): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(orderBy, { ascending: true })
        .range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE; // If we got a full page, there might be more
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Export all catalog data to Excel workbook
   *
   * @returns Excel file buffer ready for download
   */
  async exportAllData(): Promise<Buffer> {
    // Fetch all data from database
    const [parts, vehicles, crossRefs] = await Promise.all([
      this.fetchAllRows('parts', 'acr_sku'),
      this.fetchAllRows('vehicle_applications', 'part_id, make, model, start_year'),
      this.fetchAllRows('cross_references', 'acr_part_id, competitor_brand, competitor_sku'),
    ]);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ACR Automotive';
    workbook.created = new Date();

    // Add Parts sheet
    this.addPartsSheet(workbook, parts);

    // Add Vehicle Applications sheet
    this.addVehiclesSheet(workbook, vehicles);

    // Add Cross References sheet
    this.addCrossRefsSheet(workbook, crossRefs);

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }

  /**
   * Add Parts sheet to workbook
   */
  private addPartsSheet(workbook: ExcelJS.Workbook, parts: any[]): void {
    const worksheet = workbook.addWorksheet('Parts');

    // Define columns with hidden property
    worksheet.columns = [
      { header: '_id', key: 'id', width: 36, hidden: true },
      { header: '_tenant_id', key: 'tenant_id', width: 36, hidden: true },
      { header: 'ACR_SKU', key: 'acr_sku', width: 15 },
      { header: 'Part_Type', key: 'part_type', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'OEM_Number', key: 'oem_number', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Add rows
    parts.forEach((part) => {
      worksheet.addRow({
        id: part.id,
        tenant_id: part.tenant_id || null,
        acr_sku: part.acr_sku,
        part_type: part.part_type,
        description: part.description || '',
        oem_number: part.oem_number || '',
        notes: part.notes || '',
      });
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Add Vehicle Applications sheet to workbook
   */
  private addVehiclesSheet(workbook: ExcelJS.Workbook, vehicles: any[]): void {
    const worksheet = workbook.addWorksheet('Vehicle Applications');

    // Define columns with hidden property
    worksheet.columns = [
      { header: '_id', key: 'id', width: 36, hidden: true },
      { header: '_tenant_id', key: 'tenant_id', width: 36, hidden: true },
      { header: '_part_id', key: 'part_id', width: 36, hidden: true },
      { header: 'Make', key: 'make', width: 15 },
      { header: 'Model', key: 'model', width: 20 },
      { header: 'Start_Year', key: 'start_year', width: 12 },
      { header: 'End_Year', key: 'end_year', width: 12 },
      { header: 'Engine', key: 'engine', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Add rows
    vehicles.forEach((vehicle) => {
      worksheet.addRow({
        id: vehicle.id,
        tenant_id: vehicle.tenant_id || null,
        part_id: vehicle.part_id,
        make: vehicle.make,
        model: vehicle.model,
        start_year: vehicle.start_year,
        end_year: vehicle.end_year || '',
        engine: vehicle.engine || '',
        notes: vehicle.notes || '',
      });
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Add Cross References sheet to workbook
   */
  private addCrossRefsSheet(workbook: ExcelJS.Workbook, crossRefs: any[]): void {
    const worksheet = workbook.addWorksheet('Cross References');

    // Define columns with hidden property
    worksheet.columns = [
      { header: '_id', key: 'id', width: 36, hidden: true },
      { header: '_tenant_id', key: 'tenant_id', width: 36, hidden: true },
      { header: '_part_id', key: 'acr_part_id', width: 36, hidden: true },
      { header: 'Competitor_Brand', key: 'competitor_brand', width: 20 },
      { header: 'Competitor_SKU', key: 'competitor_sku', width: 20 },
    ];

    // Add rows
    crossRefs.forEach((crossRef) => {
      worksheet.addRow({
        id: crossRef.id,
        tenant_id: crossRef.tenant_id || null,
        acr_part_id: crossRef.acr_part_id,
        competitor_brand: crossRef.competitor_brand,
        competitor_sku: crossRef.competitor_sku,
      });
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Get export statistics (for API response metadata)
   */
  async getExportStats(): Promise<{
    parts: number;
    vehicles: number;
    crossRefs: number;
    totalRecords: number;
  }> {
    const [partsCount, vehiclesCount, crossRefsCount] = await Promise.all([
      supabase.from('parts').select('id', { count: 'exact', head: true }),
      supabase.from('vehicle_applications').select('id', { count: 'exact', head: true }),
      supabase.from('cross_references').select('id', { count: 'exact', head: true }),
    ]);

    const parts = partsCount.count || 0;
    const vehicles = vehiclesCount.count || 0;
    const crossRefs = crossRefsCount.count || 0;

    return {
      parts,
      vehicles,
      crossRefs,
      totalRecords: parts + vehicles + crossRefs,
    };
  }
}
