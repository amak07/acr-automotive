/**
 * Simple Tests for Streamlined PRECIOS Parser
 * 
 * Tests the simplified parser focused on one-time bootstrap import
 */

import { PreciosParser } from '../precios-parser';
import * as fs from 'fs';
import * as path from 'path';

// Path to actual Excel file
const EXCEL_FILE_PATH = path.join(__dirname, '09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx');

describe('PreciosParser - Simplified', () => {
  describe('Real Excel File Processing', () => {
    it('should parse real PRECIOS Excel file successfully', () => {
      // Skip test if Excel file doesn't exist
      if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.log('⚠️  Skipping test: Excel file not found');
        return;
      }

      const fileBuffer = fs.readFileSync(EXCEL_FILE_PATH);
      const result = PreciosParser.parseFile(fileBuffer);

      // Basic structure validation
      expect(result).toHaveProperty('acrSkus');
      expect(result).toHaveProperty('crossReferences');
      expect(result).toHaveProperty('summary');

      // Data validation
      expect(result.acrSkus.size).toBeGreaterThan(0);
      expect(result.crossReferences.length).toBeGreaterThan(0);
      
      // Performance validation
      expect(result.summary.processingTimeMs).toBeLessThan(5000); // 5 seconds max
      
      // Log actual results for verification
      console.log(`✅ Parsed ${result.acrSkus.size} ACR SKUs`);
      console.log(`✅ Generated ${result.crossReferences.length} cross-references`);
      console.log(`⚡ Processing time: ${result.summary.processingTimeMs}ms`);
    });

    it('should handle cross-references correctly', () => {
      // Skip test if Excel file doesn't exist
      if (!fs.existsSync(EXCEL_FILE_PATH)) {
        return;
      }

      const fileBuffer = fs.readFileSync(EXCEL_FILE_PATH);
      const result = PreciosParser.parseFile(fileBuffer);

      // Validate cross-reference structure
      expect(result.crossReferences.length).toBeGreaterThan(0);
      
      const firstCrossRef = result.crossReferences[0];
      expect(firstCrossRef).toHaveProperty('acrSku');
      expect(firstCrossRef).toHaveProperty('competitorSku');
      expect(firstCrossRef).toHaveProperty('competitorBrand');
      // Note: rowNumber removed in simplified version

      // Ensure no empty competitor SKUs
      const emptyCrossRefs = result.crossReferences.filter(cr => !cr.competitorSku || cr.competitorSku.trim() === '');
      expect(emptyCrossRefs.length).toBe(0);

      console.log(`✅ All ${result.crossReferences.length} cross-references have valid competitor SKUs`);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid buffer gracefully', () => {
      const invalidBuffer = Buffer.from('not-an-excel-file');
      
      // Simplified parser should not throw, but return empty results
      const result = PreciosParser.parseFile(invalidBuffer);
      expect(result.acrSkus.size).toBe(0);
      expect(result.crossReferences.length).toBe(0);
    });
  });
});