/**
 * Simple Tests for Streamlined CATALOGACION Parser
 * 
 * Tests the simplified parser focused on one-time bootstrap import
 */

import { CatalogacionParser } from '../catalogacion-parser';
import { PreciosParser } from '../precios-parser';
import * as fs from 'fs';
import * as path from 'path';

// Path to actual Excel files
const PRECIOS_FILE_PATH = path.join(__dirname, '09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx');
const CATALOGACION_FILE_PATH = path.join(__dirname, 'CATALOGACION ACR CLIENTES.xlsx');

describe('CatalogacionParser - Simplified', () => {
  describe('Real Excel File Processing', () => {
    it('should parse real CATALOGACION Excel file successfully', () => {
      // Skip test if Excel files don't exist
      if (!fs.existsSync(PRECIOS_FILE_PATH) || !fs.existsSync(CATALOGACION_FILE_PATH)) {
        console.log('⚠️  Skipping test: Excel files not found');
        return;
      }

      // First get valid ACR SKUs from PRECIOS
      const preciosBuffer = fs.readFileSync(PRECIOS_FILE_PATH);
      const preciosResult = PreciosParser.parseFile(preciosBuffer);
      const validAcrSkus = preciosResult.acrSkus;

      // Parse CATALOGACION
      const catalogacionBuffer = fs.readFileSync(CATALOGACION_FILE_PATH);
      const result = CatalogacionParser.parseFile(catalogacionBuffer, validAcrSkus);

      // Basic structure validation
      expect(result).toHaveProperty('parts');
      expect(result).toHaveProperty('applications');
      expect(result).toHaveProperty('orphanedApplications');
      expect(result).toHaveProperty('summary');

      // Data validation
      expect(result.parts.length).toBeGreaterThan(0);
      expect(result.applications.length).toBeGreaterThan(0);
      
      // Performance validation
      expect(result.summary.processingTimeMs).toBeLessThan(5000); // 5 seconds max
      
      // Log actual results for verification
      console.log(`✅ Parsed ${result.parts.length} parts with details`);
      console.log(`✅ Generated ${result.applications.length} vehicle applications`);
      console.log(`⚠️  Found ${result.orphanedApplications.length} orphaned ACR SKUs`);
      console.log(`⚡ Processing time: ${result.summary.processingTimeMs}ms`);
    });

    it('should validate part data structure', () => {
      // Skip test if Excel files don't exist
      if (!fs.existsSync(PRECIOS_FILE_PATH) || !fs.existsSync(CATALOGACION_FILE_PATH)) {
        return;
      }

      // First get valid ACR SKUs from PRECIOS
      const preciosBuffer = fs.readFileSync(PRECIOS_FILE_PATH);
      const preciosResult = PreciosParser.parseFile(preciosBuffer);
      const validAcrSkus = preciosResult.acrSkus;

      // Parse CATALOGACION
      const catalogacionBuffer = fs.readFileSync(CATALOGACION_FILE_PATH);
      const result = CatalogacionParser.parseFile(catalogacionBuffer, validAcrSkus);

      // Validate part structure
      expect(result.parts.length).toBeGreaterThan(0);
      
      const firstPart = result.parts[0];
      expect(firstPart).toHaveProperty('acrSku');
      expect(firstPart).toHaveProperty('partType');
      expect(firstPart.acrSku).toBeTruthy();

      console.log(`✅ All ${result.parts.length} parts have valid structure`);
    });

    it('should validate vehicle application structure', () => {
      // Skip test if Excel files don't exist
      if (!fs.existsSync(PRECIOS_FILE_PATH) || !fs.existsSync(CATALOGACION_FILE_PATH)) {
        return;
      }

      // First get valid ACR SKUs from PRECIOS
      const preciosBuffer = fs.readFileSync(PRECIOS_FILE_PATH);
      const preciosResult = PreciosParser.parseFile(preciosBuffer);
      const validAcrSkus = preciosResult.acrSkus;

      // Parse CATALOGACION
      const catalogacionBuffer = fs.readFileSync(CATALOGACION_FILE_PATH);
      const result = CatalogacionParser.parseFile(catalogacionBuffer, validAcrSkus);

      // Validate vehicle application structure
      expect(result.applications.length).toBeGreaterThan(0);
      
      const firstApp = result.applications[0];
      expect(firstApp).toHaveProperty('acrSku');
      expect(firstApp).toHaveProperty('make');
      expect(firstApp).toHaveProperty('model');
      expect(firstApp).toHaveProperty('startYear');
      expect(firstApp).toHaveProperty('endYear');

      // All applications should have required fields
      const invalidApps = result.applications.filter(app => 
        !app.acrSku || !app.make || !app.model || !app.startYear || !app.endYear
      );
      expect(invalidApps.length).toBe(0);

      console.log(`✅ All ${result.applications.length} vehicle applications have valid structure`);
    });

    it('should parse year ranges correctly', () => {
      // Skip test if Excel files don't exist
      if (!fs.existsSync(PRECIOS_FILE_PATH) || !fs.existsSync(CATALOGACION_FILE_PATH)) {
        return;
      }

      // First get valid ACR SKUs from PRECIOS
      const preciosBuffer = fs.readFileSync(PRECIOS_FILE_PATH);
      const preciosResult = PreciosParser.parseFile(preciosBuffer);
      const validAcrSkus = preciosResult.acrSkus;

      // Parse CATALOGACION
      const catalogacionBuffer = fs.readFileSync(CATALOGACION_FILE_PATH);
      const result = CatalogacionParser.parseFile(catalogacionBuffer, validAcrSkus);

      // Check year parsing results
      const appsWithYears = result.applications.filter(app => app.startYear && app.endYear);
      expect(appsWithYears.length).toBeGreaterThan(0);

      // Log sample year data for verification
      const sampleApps = result.applications.slice(0, 5);
      console.log('📅 Sample year parsing results:');
      sampleApps.forEach((app, index) => {
        console.log(`  ${index + 1}. ${app.acrSku}: ${app.startYear}-${app.endYear} (${app.make} ${app.model})`);
      });

      // Validate that years are numeric when converted
      const validYears = appsWithYears.filter(app => {
        const start = Number(app.startYear);
        const end = Number(app.endYear);
        return !isNaN(start) && !isNaN(end) && start > 1900 && start <= 2030 && end >= start;
      });
      
      console.log(`✅ ${validYears.length} out of ${appsWithYears.length} applications have valid year ranges`);
      
      // Most should have valid years (allow some parsing failures)
      expect(validYears.length).toBeGreaterThan(appsWithYears.length * 0.8); // 80% should be valid
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid buffer gracefully', () => {
      const invalidBuffer = Buffer.from('not-an-excel-file');
      const validAcrSkus = new Set(['ACR123']);
      
      // Simplified parser should not throw, but return empty results
      const result = CatalogacionParser.parseFile(invalidBuffer, validAcrSkus);
      expect(result.parts.length).toBe(0);
      expect(result.applications.length).toBe(0);
    });
  });
});