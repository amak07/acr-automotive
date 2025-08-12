// Excel validator tests - ACR Automotive
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ExcelValidator } from '../validator';
import { ExcelParser } from '../parser';

describe('ExcelValidator', () => {

  describe('File Basics Validation', () => {
    
    // Test that a proper Excel file with good structure passes validation
    test('should validate Excel structure correctly', () => {
      // Create a fake Excel workbook that looks like Humberto's real CATALOGACION file
      const mockWorkbook = {
        SheetNames: ['CATALOGACION CLIENTES ACR'],
        Sheets: {
          'CATALOGACION CLIENTES ACR': {
            '!ref': 'A1:N2336'  // 14 columns, 2336 rows (same as real file)
          }
        }
      };
      
      // File info that matches what we expect from a real auto parts catalog
      const mockFileInfo = {
        fileName: 'CATALOGACION ACR CLIENTES.xlsx',
        fileSize: 2841650,              // About 2.8MB file size
        sheetCount: 1,                  // Single worksheet
        activeSheetName: 'CATALOGACION CLIENTES ACR',
        headerRow: 1,
        dataStartRow: 2,
        totalRows: 2336,                // Matches our real data analysis
        detectedFormat: 'CATALOGACION' as const
      };
      
      const result = ExcelValidator['validateExcelStructure'](mockWorkbook, mockFileInfo);
      
      // A good Excel file should pass with no problems
      expect(result.errors).toHaveLength(0);     // No blocking errors
      expect(result.warnings).toHaveLength(0);   // No warnings either
    });

    // Test that completely empty Excel files are rejected
    test('should catch empty worksheets', () => {
      // Create a fake Excel file that has no worksheets (completely empty)
      const emptyWorkbook = {
        SheetNames: [],    // No worksheet names
        Sheets: {}         // No actual worksheets
      };
      
      const mockFileInfo = {
        fileName: 'empty.xlsx',
        fileSize: 1024,
        sheetCount: 0,              // Zero worksheets
        activeSheetName: '',
        headerRow: 1,
        dataStartRow: 2,
        totalRows: 0,               // No data rows
        detectedFormat: 'UNKNOWN' as const
      };
      
      const result = ExcelValidator['validateExcelStructure'](emptyWorkbook, mockFileInfo);
      
      // Empty files should be rejected with a clear error message
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('no worksheets');
    });

    // Test that suspiciously small files get warnings (might be empty or corrupted)
    test('should warn about very small files', () => {
      // Create a fake Excel file that's only 500 bytes (way too small for auto parts catalog)
      const mockFile = {
        name: 'tiny.xlsx',
        size: 500,  // Very small (under 1KB) - real catalog should be MB
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      } as File;
      
      const result = ExcelValidator['validateFileBasics'](mockFile);
      
      // Should warn user that file seems too small to be a real parts catalog
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('very small');
    });

    // Test that files over the 50MB limit are rejected
    test('should reject oversized files', () => {
      // Create a fake file that's 60MB (exceeds our 50MB safety limit)
      const mockFile = {
        name: 'huge.xlsx',
        size: 60 * 1024 * 1024,  // 60MB - way bigger than expected
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      } as File;
      
      const result = ExcelValidator['validateFileBasics'](mockFile);
      
      // Should reject the file with a clear error about size
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('too large');
    });

    // Test that files that aren't Excel format are rejected
    test('should reject non-Excel files', () => {
      // Try to upload a text file instead of Excel (common user mistake)
      const mockFile = {
        name: 'document.txt',
        size: 1024,
        type: 'text/plain'  // Wrong file type - should be Excel
      } as File;
      
      const result = ExcelValidator['validateFileBasics'](mockFile);
      
      // Should reject with a helpful error message
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Invalid file type');
    });

  });

  describe('Sample Data Validation', () => {
    
    // Test that sample data from a good auto parts catalog passes validation  
    test('should validate good sample data', () => {
      // Create sample rows that look like real wheel bearing data from Humberto's catalog
      const goodSampleRows = [
        {
          acrSku: 'ACR512342',     // Valid ACR part number
          partType: 'MAZA',        // MAZA = wheel bearing in Spanish
          make: 'HONDA',           // Vehicle make
          model: 'PILOT',          // Vehicle model  
          yearRange: '2007-2013',  // Years this part fits
          competitorSku: 'TM512342', // Cross-reference to competitor
          rowNumber: 2
        },
        {
          acrSku: 'ACR510038',
          partType: 'MAZA',
          make: 'ACURA', 
          model: 'TL',
          yearRange: '1995-1998',
          competitorSku: 'TM510038',
          rowNumber: 3
        }
      ];
      
      // Set up mock objects for testing the validation
      const mockWorksheet = {};
      const mockMapping = {
        acrSku: 1, partType: 4, make: 10, model: 11, yearRange: 12
      };
      const mockFileInfo = {
        fileName: 'test.xlsx', fileSize: 1000, sheetCount: 1,
        activeSheetName: 'Sheet1', headerRow: 1, dataStartRow: 2,
        totalRows: 10, detectedFormat: 'CATALOGACION' as const
      };
      
      // Mock the Excel parser to return our good sample data
      const originalParseExcelData = ExcelParser.parseExcelData;
      ExcelParser.parseExcelData = jest.fn().mockReturnValue({
        rows: goodSampleRows,
        errors: []
      });
      
      const result = ExcelValidator['validateSampleData'](mockWorksheet, mockMapping, mockFileInfo);
      
      // Good auto parts data should pass validation without errors
      expect(result.errors).toHaveLength(0);
      
      // Clean up - restore original method
      ExcelParser.parseExcelData = originalParseExcelData;
    });

    // Test that invalid ACR part numbers get flagged with warnings
    test('should warn about bad ACR SKU format', () => {
      // Create sample with a part number that doesn't follow ACR's format
      const badSampleRows = [
        {
          acrSku: 'XYZ123456',  // Wrong! Should be ACR123456 (ACR + numbers)
          partType: 'MAZA',
          make: 'HONDA',
          model: 'PILOT', 
          yearRange: '2007-2013',
          rowNumber: 2
        }
      ];
      
      const mockWorksheet = {};
      const mockMapping = { acrSku: 1, partType: 4, make: 10, model: 11, yearRange: 12 };
      const mockFileInfo = {
        fileName: 'test.xlsx', fileSize: 1000, sheetCount: 1,
        activeSheetName: 'Sheet1', headerRow: 1, dataStartRow: 2,
        totalRows: 10, detectedFormat: 'CATALOGACION' as const
      };
      
      // Mock the parser to return data with invalid part numbers
      const originalParseExcelData = ExcelParser.parseExcelData;
      ExcelParser.parseExcelData = jest.fn().mockReturnValue({
        rows: badSampleRows,
        errors: []
      });
      
      const result = ExcelValidator['validateSampleData'](mockWorksheet, mockMapping, mockFileInfo);
      
      // Should warn user about the incorrect ACR part number format
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('ACR SKU format');
      
      // Clean up - restore original method  
      ExcelParser.parseExcelData = originalParseExcelData;
    });

  });

  describe('Validation Summary', () => {
    
    // Test that successful validation gives users a clear, encouraging message
    test('should create clear validation summary for success', () => {
      // Mock a successful validation result (like Humberto's real CATALOGACION file)
      const successResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fileInfo: {
          fileName: 'CATALOGACION ACR CLIENTES.xlsx',
          fileSize: 2841650,        // Real file size
          sheetCount: 1,
          activeSheetName: 'CATALOGACION CLIENTES ACR',
          headerRow: 1,
          dataStartRow: 2,
          totalRows: 2336,          // Real row count
          detectedFormat: 'CATALOGACION' as const
        }
      };
      
      const summary = ExcelValidator.getValidationSummary(successResult);
      
      // Should give user a positive message with helpful details
      expect(summary).toContain('✅');           // Success checkmark
      expect(summary).toContain('CATALOGACION'); // Format detected
      expect(summary).toContain('2336');         // Row count
    });

    // Test that failed validation gives users clear error information
    test('should create clear validation summary for failures', () => {
      // Mock a failed validation with multiple errors and warnings
      const failureResult = {
        isValid: false,
        errors: [
          { row: 0, errorType: 'invalid_format' as const, message: 'Bad file type' },
          { row: 15, errorType: 'required' as const, message: 'Missing ACR SKU' }
        ],
        warnings: [
          { row: 0, errorType: 'invalid_format' as const, message: 'File seems small' }
        ],
        fileInfo: {
          fileName: 'bad.xlsx', fileSize: 1000, sheetCount: 1,
          activeSheetName: 'Sheet1', headerRow: 1, dataStartRow: 2,
          totalRows: 10, detectedFormat: 'UNKNOWN' as const
        }
      };
      
      const summary = ExcelValidator.getValidationSummary(failureResult);
      
      // Should tell user exactly how many problems were found
      expect(summary).toContain('❌');           // Failure indicator
      expect(summary).toContain('2 error(s)');  // Error count
      expect(summary).toContain('1 warning(s)'); // Warning count
    });

  });

  describe('Real File Integration', () => {
    
    let catalogacionBuffer: Buffer;
    
    beforeAll(() => {
      // Load Humberto's actual CATALOGACION file to test with real data
      const catalogacionPath = path.join(__dirname, 'CATALOGACION ACR CLIENTES.xlsx');
      if (fs.existsSync(catalogacionPath)) {
        catalogacionBuffer = fs.readFileSync(catalogacionPath);
      }
    });

    // Test that our validator correctly handles the real CATALOGACION file structure
    test('should validate real CATALOGACION file structure', () => {
      if (!catalogacionBuffer) {
        console.log('CATALOGACION file not found, skipping integration test');
        return;
      }

      // Parse the actual Excel file to get its structure
      const workbook = XLSX.read(catalogacionBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      
      // Build file info based on the real file properties
      const fileInfo = {
        fileName: 'CATALOGACION ACR CLIENTES.xlsx',
        fileSize: catalogacionBuffer.length,  // Real file size (about 2.8MB)
        sheetCount: workbook.SheetNames.length,
        activeSheetName: sheetName,
        headerRow: 1,
        dataStartRow: 2,
        totalRows: range.e.r + 1,             // Real row count (2,336)
        detectedFormat: 'UNKNOWN' as const
      };

      // Test our structure validation against the real file
      const structureResult = ExcelValidator['validateExcelStructure'](workbook, fileInfo);
      
      console.log(`Real file structure validation:`);
      console.log(`- Errors: ${structureResult.errors.length}`);
      console.log(`- Warnings: ${structureResult.warnings.length}`);
      console.log(`- Total rows: ${fileInfo.totalRows}`);
      
      // The real CATALOGACION file should pass all structure checks
      expect(structureResult.errors).toHaveLength(0);   // No errors
      expect(fileInfo.totalRows).toBe(2336);           // Matches our analysis
      expect(fileInfo.sheetCount).toBe(1);             // Single worksheet
    });

  });

});