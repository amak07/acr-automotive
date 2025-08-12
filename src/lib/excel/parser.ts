// Excel file reading and column detection - ACR Automotive
import * as XLSX from 'xlsx';
import { trim, isEmpty } from 'lodash';
import { 
  ColumnMapping, 
  ExcelRow, 
  ExcelFileInfo, 
  ValidationResult, 
  ParseError,
  SPANISH_HEADERS,
  ColumnMappingKey 
} from './types';

export class ExcelParser {
  
  /**
   * Read Excel file and return file information
   */
  static readExcelFile(file: File): Promise<{ workbook: XLSX.WorkBook; fileInfo: ExcelFileInfo }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          
          const fileInfo: ExcelFileInfo = {
            fileName: file.name,
            fileSize: file.size,
            sheetCount: workbook.SheetNames.length,
            activeSheetName: sheetName,
            headerRow: 1, // Will be detected in detectColumnMapping
            dataStartRow: 2, // Will be adjusted after header detection
            totalRows: range.e.r + 1,
            detectedFormat: 'UNKNOWN'
          };
          
          resolve({ workbook, fileInfo });
        } catch (error) {
          reject(new Error(`Failed to read Excel file: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  }

  /**
   * Detect column mapping from Spanish headers
   */
  static detectColumnMapping(worksheet: XLSX.WorkSheet, fileInfo: ExcelFileInfo): {
    mapping: ColumnMapping | null;
    detectedFormat: 'CATALOGACION' | 'LISTA_DE_PRECIOS' | 'UNKNOWN';
    headerRow: number;
    errors: ParseError[];
  } {
    const errors: ParseError[] = [];
    let bestMapping: ColumnMapping | null = null;
    let bestScore = 0;
    let detectedHeaderRow = 1;
    let detectedFormat: 'CATALOGACION' | 'LISTA_DE_PRECIOS' | 'UNKNOWN' = 'UNKNOWN';

    // Try different header row positions (1-5)
    for (let headerRow = 1; headerRow <= Math.min(5, fileInfo.totalRows); headerRow++) {
      const headers = this.extractHeaderRow(worksheet, headerRow);
      const { mapping, score, format } = this.matchHeaders(headers);
      
      if (score > bestScore) {
        bestScore = score;
        bestMapping = mapping;
        detectedHeaderRow = headerRow;
        detectedFormat = format;
      }
    }

    // Validate required columns are present
    if (bestMapping) {
      const requiredFields: (keyof ColumnMapping)[] = ['acrSku', 'partType', 'make', 'model', 'yearRange'];
      
      for (const field of requiredFields) {
        if (bestMapping[field] === undefined) {
          errors.push({
            row: detectedHeaderRow,
            field,
            errorType: 'required',
            message: `Required column '${field}' not found in Excel headers`,
            suggestion: `Expected Spanish headers like: ${SPANISH_HEADERS[field as ColumnMappingKey].join(', ')}`
          });
        }
      }
    } else {
      errors.push({
        row: 0,
        errorType: 'invalid_format',
        message: 'Could not detect valid column structure in Excel file',
        suggestion: 'Ensure file has Spanish headers like: ACR, Clase, MARCA, APLICACIÓN, AÑO'
      });
    }

    return {
      mapping: bestMapping,
      detectedFormat,
      headerRow: detectedHeaderRow,
      errors
    };
  }

  /**
   * Extract header row as string array
   */
  private static extractHeaderRow(worksheet: XLSX.WorkSheet, rowIndex: number): string[] {
    const headers: string[] = [];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: col });
      const cell = worksheet[cellAddress];
      const value = cell ? String(cell.v).trim() : '';
      headers.push(value);
    }
    
    return headers;
  }

  /**
   * Match headers against Spanish column mappings
   */
  private static matchHeaders(headers: string[]): {
    mapping: ColumnMapping | null;
    score: number;
    format: 'CATALOGACION' | 'LISTA_DE_PRECIOS' | 'UNKNOWN';
  } {
    const mapping: Partial<ColumnMapping> = {};
    let score = 0;
    let format: 'CATALOGACION' | 'LISTA_DE_PRECIOS' | 'UNKNOWN' = 'UNKNOWN';

    // Check each header position
    headers.forEach((header, index) => {
      const normalizedHeader = this.normalizeHeader(header);
      
      // Try to match against each field's possible headers
      fieldLoop: for (const [field, possibleHeaders] of Object.entries(SPANISH_HEADERS)) {
        const fieldKey = field as ColumnMappingKey;
        
        // Skip if this field is already mapped
        if ((mapping as any)[fieldKey] !== undefined) {
          continue;
        }
        
        for (const expectedHeader of possibleHeaders) {
          if (this.headersMatch(normalizedHeader, expectedHeader)) {
            (mapping as any)[fieldKey] = index;
            score += this.getFieldWeight(fieldKey);
            
            // Detect format based on specific columns
            if (fieldKey === 'competitorSku' && expectedHeader === 'TMK') {
              format = 'CATALOGACION';
            }
            break fieldLoop; // Break out of both loops for this header
          }
        }
      }
    });

    // Determine format if not already detected
    if (format === 'UNKNOWN' && score > 0) {
      format = mapping.competitorSku !== undefined ? 'CATALOGACION' : 'LISTA_DE_PRECIOS';
    }

    // Return null if score too low (missing critical columns)
    return {
      mapping: score >= 40 ? mapping as ColumnMapping : null, // Require at least basic structure
      score,
      format
    };
  }

  /**
   * Normalize header text for comparison
   */
  private static normalizeHeader(header: string): string {
    return trim(header)
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/Ñ/g, 'N');
  }

  /**
   * Check if headers match (fuzzy matching)
   */
  private static headersMatch(actual: string, expected: string): boolean {
    const normalizedExpected = this.normalizeHeader(expected);
    
    // Exact match
    if (actual === normalizedExpected) return true;
    
    // Contains match
    if (actual.includes(normalizedExpected) || normalizedExpected.includes(actual)) return true;
    
    // Remove common punctuation and spaces for flexible matching
    const cleanActual = actual.replace(/[^\w]/g, '');
    const cleanExpected = normalizedExpected.replace(/[^\w]/g, '');
    
    if (cleanActual === cleanExpected) return true;
    
    // Special case for partial matches (like "URL" matching "URL IMAGEN")
    if (cleanActual.includes(cleanExpected) || cleanExpected.includes(cleanActual)) {
      // Only allow partial matches if one string is significantly shorter
      const minLength = Math.min(cleanActual.length, cleanExpected.length);
      const maxLength = Math.max(cleanActual.length, cleanExpected.length);
      return minLength >= 3 && maxLength / minLength <= 3;
    }
    
    return false;
  }

  /**
   * Get importance weight for field matching
   */
  private static getFieldWeight(field: ColumnMappingKey): number {
    const weights = {
      acrSku: 20,        // Critical - primary key
      partType: 15,      // Critical - business category  
      make: 15,          // Critical - vehicle identification
      model: 15,         // Critical - vehicle identification
      yearRange: 10,     // Important - vehicle compatibility
      competitorSku: 8,  // Important - cross-reference feature
      position: 5,       // Optional
      absType: 5,        // Optional
      boltPattern: 5,    // Optional
      driveType: 5,      // Optional
      specifications: 3, // Optional
      imageUrl: 2,       // Optional
      id: 1,             // Optional
      syd: 0             // Ignored
    };
    
    return weights[field] || 0;
  }

  /**
   * Parse Excel data into ExcelRow objects
   */
  static parseExcelData(
    worksheet: XLSX.WorkSheet, 
    mapping: ColumnMapping, 
    startRow: number,
    fileInfo: ExcelFileInfo
  ): { rows: ExcelRow[]; errors: ParseError[] } {
    const rows: ExcelRow[] = [];
    const errors: ParseError[] = [];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');

    for (let rowIndex = startRow - 1; rowIndex <= range.e.r; rowIndex++) {
      const excelRowNumber = rowIndex + 1;
      
      try {
        const rowData = this.extractRowData(worksheet, rowIndex, mapping);
        
        // Skip empty rows
        if (this.isEmptyRow(rowData)) continue;
        
        // Validate required fields
        const rowErrors = this.validateRowData(rowData, excelRowNumber);
        errors.push(...rowErrors);
        
        // Add row if no blocking errors
        if (rowErrors.every(error => error.errorType !== 'required')) {
          rows.push({
            ...rowData,
            rowNumber: excelRowNumber
          });
        }
        
      } catch (error) {
        errors.push({
          row: excelRowNumber,
          errorType: 'invalid_format',
          message: `Failed to parse row: ${error}`,
          suggestion: 'Check for invalid characters or formatting'
        });
      }
    }

    return { rows, errors };
  }

  /**
   * Extract data from a single Excel row
   */
  private static extractRowData(worksheet: XLSX.WorkSheet, rowIndex: number, mapping: ColumnMapping): Omit<ExcelRow, 'rowNumber'> {
    const getValue = (colIndex?: number): string => {
      if (colIndex === undefined) return '';
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      const cell = worksheet[cellAddress];
      return cell ? trim(String(cell.v)) : '';
    };

    return {
      acrSku: getValue(mapping.acrSku),
      competitorSku: getValue(mapping.competitorSku) || undefined,
      partType: getValue(mapping.partType),
      position: getValue(mapping.position) || undefined,
      absType: getValue(mapping.absType) || undefined,
      boltPattern: getValue(mapping.boltPattern) || undefined,
      driveType: getValue(mapping.driveType) || undefined,
      specifications: getValue(mapping.specifications) || undefined,
      make: getValue(mapping.make),
      model: getValue(mapping.model),
      yearRange: getValue(mapping.yearRange),
      imageUrl: getValue(mapping.imageUrl) || undefined
    };
  }

  /**
   * Check if row is effectively empty
   */
  private static isEmptyRow(rowData: Omit<ExcelRow, 'rowNumber'>): boolean {
    return isEmpty(rowData.acrSku) && isEmpty(rowData.partType) && isEmpty(rowData.make);
  }

  /**
   * Validate individual row data
   */
  private static validateRowData(rowData: Omit<ExcelRow, 'rowNumber'>, rowNumber: number): ParseError[] {
    const errors: ParseError[] = [];

    // Required field validation
    if (isEmpty(rowData.acrSku)) {
      errors.push({
        row: rowNumber,
        field: 'acrSku',
        errorType: 'required',
        message: 'ACR SKU is required',
        cellValue: rowData.acrSku
      });
    }

    if (isEmpty(rowData.partType)) {
      errors.push({
        row: rowNumber,
        field: 'partType',
        errorType: 'required', 
        message: 'Part type (Clase) is required',
        cellValue: rowData.partType
      });
    }

    if (isEmpty(rowData.make)) {
      errors.push({
        row: rowNumber,
        field: 'make',
        errorType: 'required',
        message: 'Vehicle make (MARCA) is required',
        cellValue: rowData.make
      });
    }

    if (isEmpty(rowData.model)) {
      errors.push({
        row: rowNumber,
        field: 'model',
        errorType: 'required',
        message: 'Vehicle model (APLICACIÓN) is required',
        cellValue: rowData.model
      });
    }

    if (isEmpty(rowData.yearRange)) {
      errors.push({
        row: rowNumber,
        field: 'yearRange',
        errorType: 'required',
        message: 'Year range (AÑO) is required',
        cellValue: rowData.yearRange
      });
    }

    return errors;
  }
}