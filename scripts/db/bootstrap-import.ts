#!/usr/bin/env tsx

/**
 * One-Time Bootstrap Import Script
 * 
 * This script imports data from PRECIOS and CATALOGACION Excel files
 * into the Supabase database. Run this locally once to bootstrap the system,
 * then use the admin CRUD interface for ongoing management.
 * 
 * Usage:
 *   npm run bootstrap
 * 
 * Or manually:
 *   npx tsx scripts/bootstrap-import.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PreciosParser } from '../../src/lib/excel/precios-parser';
import { CatalogacionParser } from '../../src/lib/excel/catalogacion-parser';
import { importPreciosData, importCatalogacionData } from '../../src/lib/supabase/import';
import { supabase } from '../../src/lib/supabase/client';

// Excel file paths (original client files)
const PRECIOS_FILE = 'archive/original-client-files/09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx';
const CATALOGACION_FILE = 'archive/original-client-files/CATALOGACION ACR CLIENTES.xlsx';

async function main() {
  console.log('🚀 ACR Automotive Bootstrap Import Starting...\n');
  console.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`📍 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log('');

  try {
    // Step 1: Check if Excel files exist
    console.log('📂 Checking Excel files...');
    const preciosPath = path.resolve(PRECIOS_FILE);
    const catalogacionPath = path.resolve(CATALOGACION_FILE);

    if (!fs.existsSync(preciosPath)) {
      throw new Error(`PRECIOS file not found: ${preciosPath}`);
    }
    if (!fs.existsSync(catalogacionPath)) {
      throw new Error(`CATALOGACION file not found: ${catalogacionPath}`);
    }
    console.log('✅ Excel files found');

    // Step 2: Check database connection
    console.log('\n🔌 Testing database connection...');
    const { error: dbError } = await supabase.from('parts').select('count').limit(1);
    if (dbError) {
      throw new Error(`Database connection failed: ${dbError.message}`);
    }
    console.log('✅ Database connection successful');

    // Step 3: Parse PRECIOS file
    console.log('\n📊 Parsing PRECIOS Excel file...');
    const preciosBuffer = fs.readFileSync(preciosPath);
    const preciosResult = PreciosParser.parseFile(preciosBuffer);

    console.log(`✅ PRECIOS parsed: ${preciosResult.acrSkus.size} parts, ${preciosResult.crossReferences.length} cross-references`);

    // Step 4: Import PRECIOS data
    console.log('\n💾 Importing PRECIOS data to database...');
    const { parts: importedParts } = await importPreciosData(preciosResult);
    console.log(`✅ PRECIOS imported: ${importedParts.length} parts with cross-references`);

    // Step 5: Parse CATALOGACION file
    console.log('\n📊 Parsing CATALOGACION Excel file...');
    const catalogacionBuffer = fs.readFileSync(catalogacionPath);
    
    // Create set of valid ACR SKUs from PRECIOS for validation
    const validAcrSkus = preciosResult.acrSkus;
    const catalogacionResult = CatalogacionParser.parseFile(catalogacionBuffer, validAcrSkus);

    const catalogacionData = catalogacionResult;
    console.log(`✅ CATALOGACION parsed: ${catalogacionData.parts.length} parts, ${catalogacionData.applications.length} vehicle applications`);
    
    if (catalogacionData.orphanedApplications.length > 0) {
      console.log(`⚠️  Found ${catalogacionData.orphanedApplications.length} orphaned SKUs (will be skipped)`);
    }

    // Step 6: Import CATALOGACION data
    console.log('\n💾 Importing CATALOGACION data to database...');
    const catalogacionImportResult = await importCatalogacionData(catalogacionData, importedParts);
    console.log(`✅ CATALOGACION imported: ${catalogacionImportResult.insertedApplications} vehicle applications`);
    console.log(`✅ Part details updated: ${catalogacionImportResult.updatedParts} parts enhanced`);

    // Step 7: Final summary
    console.log('\n🎉 Bootstrap Import Completed Successfully!\n');
    console.log('📊 Final Summary:');
    console.log(`   Parts in database: ${importedParts.length}`);
    console.log(`   Cross-references: ${preciosResult.crossReferences.length}`);
    console.log(`   Vehicle applications: ${catalogacionImportResult.insertedApplications}`);
    console.log(`   Orphaned SKUs: ${catalogacionImportResult.orphanedSkus.length}`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Visit /admin to manage parts via CRUD interface');
    console.log('   3. Excel parsers can now be archived');
    console.log('\n✅ System ready for admin CRUD management!');

  } catch (error) {
    console.error('\n❌ Bootstrap Import Failed:');
    console.error(error instanceof Error ? error.message : error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Excel files are in the data/ directory');
    console.log('   2. Check SUPABASE environment variables in .env.local');
    console.log('   3. Verify database schema is deployed');
    process.exit(1);
  }
}

// Run the bootstrap import
main().catch(console.error);