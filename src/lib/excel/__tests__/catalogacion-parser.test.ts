import { CatalogacionParser } from '../catalogacion-parser';
import { PreciosParser } from '../precios-parser';
import { CONFLICT_TYPES } from '../conflict-types';
import * as fs from 'fs';
import * as path from 'path';

describe('CatalogacionParser', () => {
  const catalogacionPath = path.join(__dirname, 'CATALOGACION ACR CLIENTES.xlsx');
  const preciosPath = path.join(__dirname, '09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx');

  test('should parse CATALOGACION file successfully with conflict detection', () => {
    // First get valid ACR SKUs from PRECIOS
    const preciosBuffer = fs.readFileSync(preciosPath);
    const preciosResult = PreciosParser.parseFile(preciosBuffer);
    
    // Then parse CATALOGACION with validation
    const catalogacionBuffer = fs.readFileSync(catalogacionPath);
    const result = CatalogacionParser.parseFile(catalogacionBuffer, preciosResult.data.acrSkus);
    
    // ProcessingResult assertions
    expect(result.success).toBe(true);
    expect(result.canProceed).toBe(true);
    expect(result.conflicts).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.summary).toBeDefined();
    
    // Data assertions (now nested under result.data)
    expect(result.data.parts).toBeDefined();
    expect(result.data.applications).toBeDefined();
    expect(result.data.orphanedApplications).toBeDefined();
    expect(result.data.summary.processingTimeMs).toBeLessThan(1000);
    
    // Should have some data
    expect(result.data.summary.totalParts).toBeGreaterThan(0);
    expect(result.data.summary.totalApplications).toBeGreaterThan(0);
    
    // Conflict detection assertions
    expect(result.conflicts).toBeInstanceOf(Array);
    if (result.conflicts.length > 0) {
      const orphanedConflict = result.conflicts.find(c => c.conflictType === CONFLICT_TYPES.ORPHANED_APPLICATION);
      if (orphanedConflict) {
        expect(orphanedConflict.severity).toBe('warning');
        expect(orphanedConflict.impact).toBe('non-blocking');
        expect(orphanedConflict.source).toBe('cross-validation');
      }
    }
    
    console.log('CATALOGACION Results:', result.data.summary);
    console.log('Conflicts found:', result.conflicts.length);
  });

  test('should detect and report orphaned applications via conflict system', () => {
    // Get PRECIOS master list
    const preciosBuffer = fs.readFileSync(preciosPath);
    const preciosResult = PreciosParser.parseFile(preciosBuffer);
    
    // Parse CATALOGACION
    const catalogacionBuffer = fs.readFileSync(catalogacionPath);
    const result = CatalogacionParser.parseFile(catalogacionBuffer, preciosResult.data.acrSkus);
    
    // Check conflict detection for orphaned SKUs
    const orphanedConflict = result.conflicts.find(c => c.conflictType === CONFLICT_TYPES.ORPHANED_APPLICATION);
    
    if (result.data.summary.orphanedCount > 0) {
      // Should have orphaned conflict
      expect(orphanedConflict).toBeDefined();
      expect(orphanedConflict.severity).toBe('warning');
      expect(orphanedConflict.impact).toBe('non-blocking');
      expect(orphanedConflict.affectedSkus).toEqual(result.data.orphanedApplications);
      
      console.log('Found orphaned SKUs via conflict system:');
      console.log(`Conflict ID: ${orphanedConflict.id}`);
      console.log(`Description: ${orphanedConflict.description}`);
      console.log(`Suggestion: ${orphanedConflict.suggestion}`);
      result.data.orphanedApplications.forEach(sku => console.log(`  - ${sku}`));
    } else {
      // Should have no orphaned conflict
      expect(orphanedConflict).toBeUndefined();
    }
    
    // Adjust expectation based on real data
    expect(result.data.summary.orphanedCount).toBeLessThanOrEqual(15);
    
    console.log('Orphaned count:', result.data.summary.orphanedCount);
    console.log('Total conflicts:', result.conflicts.length);
  });

  test('should create unique parts from multiple vehicle applications', () => {
    // Get PRECIOS master list
    const preciosBuffer = fs.readFileSync(preciosPath);
    const preciosResult = PreciosParser.parseFile(preciosBuffer);
    
    // Parse CATALOGACION
    const catalogacionBuffer = fs.readFileSync(catalogacionPath);
    const result = CatalogacionParser.parseFile(catalogacionBuffer, preciosResult.data.acrSkus);
    
    // Should have fewer parts than applications (one part can fit multiple vehicles)
    expect(result.data.summary.totalParts).toBeLessThanOrEqual(result.data.summary.totalApplications);
    
    // Each part should have unique ACR SKU
    const partSkus = result.data.parts.map(p => p.acrSku);
    const uniqueSkus = new Set(partSkus);
    expect(partSkus.length).toBe(uniqueSkus.size);
    
    console.log('Parts vs Applications ratio:', {
      parts: result.data.summary.totalParts,
      applications: result.data.summary.totalApplications,
      ratio: (result.data.summary.totalApplications / result.data.summary.totalParts).toFixed(2)
    });
  });

  test('should handle performance requirements', () => {
    // Get PRECIOS master list
    const preciosBuffer = fs.readFileSync(preciosPath);
    const preciosResult = PreciosParser.parseFile(preciosBuffer);
    
    // Measure CATALOGACION parsing performance
    const startTime = Date.now();
    const catalogacionBuffer = fs.readFileSync(catalogacionPath);
    const result = CatalogacionParser.parseFile(catalogacionBuffer, preciosResult.data.acrSkus);
    const endTime = Date.now();
    
    // Should process in under 200ms (target from PLANNING.md)
    expect(result.data.summary.processingTimeMs).toBeLessThan(200);
    expect(result.summary.processingTimeMs).toBeLessThan(200); // ProcessingResult summary
    expect(endTime - startTime).toBeLessThan(300); // Include file I/O overhead
    
    console.log('Performance metrics:', {
      dataProcessingTime: result.data.summary.processingTimeMs,
      totalProcessingTime: result.summary.processingTimeMs,
      totalTime: endTime - startTime,
      rowsPerSecond: Math.round(result.data.summary.totalApplications / (result.data.summary.processingTimeMs / 1000))
    });
  });
});