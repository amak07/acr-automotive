import ExcelJS from 'exceljs';
import { supabase } from '@/lib/supabase/client';
import {
  SHEET_NAMES,
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  CROSS_REFERENCES_COLUMNS,
  ExportFilters,
} from '@/services/excel/shared';

/**
 * ExcelExportService
 *
 * Handles Excel export of catalog data in standardized 3-sheet format.
 * Supports both full catalog export and filtered export based on search criteria.
 * Uses ExcelJS library for full Excel feature support including hidden columns.
 *
 * Sheet Structure:
 * 1. Parts - All/filtered parts with hidden ID columns
 *    Columns: _id (hidden), ACR_SKU, Part_Type, Position_Type, ABS_Type, Bolt_Pattern, Drive_Type, Specifications
 *
 * 2. Vehicle Applications - Vehicle fitment data for exported parts
 *    Columns: _id (hidden), _part_id (hidden), ACR_SKU, Make, Model, Start_Year, End_Year
 *
 * 3. Cross References - Competitor cross-references for exported parts
 *    Columns: _id (hidden), _acr_part_id (hidden), ACR_SKU, Competitor_Brand, Competitor_SKU
 *
 * Hidden Columns (for import matching):
 * - _id: Record UUID (hidden, for matching on re-import)
 * - _part_id: Foreign key UUID (hidden, for VAs)
 * - _acr_part_id: Foreign key UUID (hidden, for CRs)
 *
 * Visible ACR_SKU:
 * - Parts sheet: Direct column from parts table
 * - VA/CR sheets: Joined from parts table for user-friendly reference (Humberto maps by SKU, not UUID)
 *
 * Export-Import Loop:
 * 1. User exports to get IDs (all data or filtered results)
 * 2. User edits data in Excel (using ACR_SKU for readability)
 * 3. User imports - system matches by hidden _id columns and applies changes
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
      this.fetchVehiclesWithSku(),
      this.fetchCrossRefsWithSku(),
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
   * Export filtered catalog data to Excel workbook
   *
   * Filters parts based on search criteria, then includes all related
   * vehicle applications and cross-references for the filtered parts.
   *
   * @param filters - Search filters to apply
   * @returns Excel file buffer ready for download
   */
  async exportFiltered(filters: ExportFilters): Promise<Buffer> {
    // Fetch filtered parts
    const parts = await this.fetchFilteredParts(filters);

    // Extract part IDs for relationship queries
    const partIds = parts.map((p) => p.id);

    // If no parts match, return empty workbook
    if (partIds.length === 0) {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ACR Automotive';
      workbook.created = new Date();

      this.addPartsSheet(workbook, []);
      this.addVehiclesSheet(workbook, []);
      this.addCrossRefsSheet(workbook, []);

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    }

    // Fetch all vehicle applications and cross-references for the filtered parts
    const [vehicles, crossRefs] = await Promise.all([
      this.fetchRowsByPartIds('vehicle_applications', partIds),
      this.fetchRowsByPartIds('cross_references', partIds),
    ]);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ACR Automotive';
    workbook.created = new Date();

    // Add sheets
    this.addPartsSheet(workbook, parts);
    this.addVehiclesSheet(workbook, vehicles);
    this.addCrossRefsSheet(workbook, crossRefs);

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }

  /**
   * Fetch parts with filters applied
   */
  private async fetchFilteredParts(filters: ExportFilters): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('parts')
        .select('*')
        .order('acr_sku', { ascending: true });

      // Apply filters
      if (filters.search) {
        query = query.or(`acr_sku.ilike.%${filters.search}%,part_type.ilike.%${filters.search}%,specifications.ilike.%${filters.search}%`);
      }
      if (filters.part_type) {
        query = query.eq('part_type', filters.part_type);
      }
      if (filters.position_type) {
        query = query.eq('position_type', filters.position_type);
      }
      if (filters.abs_type) {
        query = query.eq('abs_type', filters.abs_type);
      }
      if (filters.drive_type) {
        query = query.eq('drive_type', filters.drive_type);
      }
      if (filters.bolt_pattern) {
        query = query.eq('bolt_pattern', filters.bolt_pattern);
      }

      const { data, error } = await query.range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch filtered parts: ${error.message}`);
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Fetch all vehicle applications with ACR_SKU (joined from parts table)
   */
  private async fetchVehiclesWithSku(): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('vehicle_applications')
        .select('*, parts!inner(acr_sku)')
        .order('part_id, make, model, start_year', { ascending: true })
        .range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch vehicle applications: ${error.message}`);
      }

      if (data && data.length > 0) {
        // Flatten the nested parts.acr_sku into top-level acr_sku
        const flattened = data.map((row: any) => ({
          ...row,
          acr_sku: row.parts?.acr_sku || '',
          parts: undefined, // Remove nested object
        }));
        allRows = allRows.concat(flattened);
        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Fetch all cross references with ACR_SKU (joined from parts table)
   */
  private async fetchCrossRefsWithSku(): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('cross_references')
        .select('*, parts!inner(acr_sku)')
        .order('acr_part_id, competitor_brand, competitor_sku', { ascending: true })
        .range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch cross references: ${error.message}`);
      }

      if (data && data.length > 0) {
        // Flatten the nested parts.acr_sku into top-level acr_sku
        const flattened = data.map((row: any) => ({
          ...row,
          acr_sku: row.parts?.acr_sku || '',
          parts: undefined, // Remove nested object
        }));
        allRows = allRows.concat(flattened);
        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Fetch vehicle applications or cross-references by part IDs (with ACR_SKU joined)
   */
  private async fetchRowsByPartIds(tableName: string, partIds: string[]): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];

    // Process part IDs in chunks to avoid URL length limits
    const CHUNK_SIZE = 100; // Max 100 IDs per query
    for (let i = 0; i < partIds.length; i += CHUNK_SIZE) {
      const chunk = partIds.slice(i, i + CHUNK_SIZE);

      let start = 0;
      let hasMore = true;

      while (hasMore) {
        const partIdColumn = tableName === 'vehicle_applications' ? 'part_id' : 'acr_part_id';

        const { data, error } = await supabase
          .from(tableName)
          .select('*, parts!inner(acr_sku)')
          .in(partIdColumn, chunk)
          .range(start, start + PAGE_SIZE - 1);

        if (error) {
          throw new Error(`Failed to fetch ${tableName} by part IDs: ${error.message}`);
        }

        if (data && data.length > 0) {
          // Flatten the nested parts.acr_sku into top-level acr_sku
          const flattened = data.map((row: any) => ({
            ...row,
            acr_sku: row.parts?.acr_sku || '',
            parts: undefined, // Remove nested object
          }));
          allRows = allRows.concat(flattened);
          start += PAGE_SIZE;
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }
    }

    return allRows;
  }

  /**
   * Add Parts sheet to workbook
   */
  private addPartsSheet(workbook: ExcelJS.Workbook, parts: any[]): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.PARTS);

    // Define columns using shared constants (single source of truth)
    worksheet.columns = PARTS_COLUMNS;

    // Add rows
    parts.forEach((part) => {
      worksheet.addRow({
        _id: part.id, // Map database 'id' to Excel '_id' column key
        acr_sku: part.acr_sku,
        part_type: part.part_type,
        position_type: part.position_type || '',
        abs_type: part.abs_type || '',
        bolt_pattern: part.bolt_pattern || '',
        drive_type: part.drive_type || '',
        specifications: part.specifications || '',
      });
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Add Vehicle Applications sheet to workbook
   */
  private addVehiclesSheet(workbook: ExcelJS.Workbook, vehicles: any[]): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS);

    // Define columns using shared constants (single source of truth)
    worksheet.columns = VEHICLE_APPLICATIONS_COLUMNS;

    // Add rows
    vehicles.forEach((vehicle) => {
      worksheet.addRow({
        _id: vehicle.id, // Map database 'id' to Excel '_id' column key
        _part_id: vehicle.part_id, // Map database 'part_id' to Excel '_part_id' column key
        acr_sku: vehicle.acr_sku || '',
        make: vehicle.make,
        model: vehicle.model,
        start_year: vehicle.start_year,
        end_year: vehicle.end_year,
      });
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Add Cross References sheet to workbook
   */
  private addCrossRefsSheet(workbook: ExcelJS.Workbook, crossRefs: any[]): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.CROSS_REFERENCES);

    // Define columns using shared constants (single source of truth)
    worksheet.columns = CROSS_REFERENCES_COLUMNS;

    // Add rows
    crossRefs.forEach((crossRef) => {
      worksheet.addRow({
        _id: crossRef.id, // Map database 'id' to Excel '_id' column key
        _acr_part_id: crossRef.acr_part_id, // Map database 'acr_part_id' to Excel '_acr_part_id' column key
        acr_sku: crossRef.acr_sku || '',
        competitor_brand: crossRef.competitor_brand || '',
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
