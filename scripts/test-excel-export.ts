/**
 * Test Excel Export API
 *
 * Validates that the /api/admin/export endpoint works correctly:
 * - Downloads Excel file
 * - File has 3 sheets (Parts, Vehicle Applications, Cross References)
 * - Hidden columns are present but not visible
 * - Data matches database counts
 *
 * Usage:
 *   npm run test:export
 */

import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'tmp');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'test-export.xlsx');

async function testExcelExport() {
  console.log('🧪 Testing Excel Export API...\n');

  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Call export endpoint
    console.log('📥 Downloading Excel file from /api/admin/export...');
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/admin/export`);
    const duration = Date.now() - start;

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }

    // 2. Get export stats from headers
    const stats = {
      parts: parseInt(response.headers.get('X-Export-Parts') || '0'),
      vehicles: parseInt(response.headers.get('X-Export-Vehicles') || '0'),
      crossRefs: parseInt(response.headers.get('X-Export-CrossRefs') || '0'),
      total: parseInt(response.headers.get('X-Export-Total') || '0'),
    };

    console.log(`✅ Downloaded in ${duration}ms`);
    console.log(`   Parts: ${stats.parts}`);
    console.log(`   Vehicles: ${stats.vehicles}`);
    console.log(`   Cross-Refs: ${stats.crossRefs}`);
    console.log(`   Total Records: ${stats.total}\n`);

    // 3. Save file and read with xlsx
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(OUTPUT_FILE, Buffer.from(buffer));
    console.log(`💾 Saved to: ${OUTPUT_FILE}\n`);

    // 4. Parse Excel file with both XLSX and ExcelJS
    console.log('📊 Analyzing Excel structure...\n');
    const workbook = XLSX.readFile(OUTPUT_FILE);
    const excelJSWorkbook = new ExcelJS.Workbook();
    await excelJSWorkbook.xlsx.readFile(OUTPUT_FILE);

    // 5. Validate sheet structure
    const results: { test: string; passed: boolean; message: string }[] = [];

    // Test 1: Has 3 sheets
    const expectedSheets = ['Parts', 'Vehicle Applications', 'Cross References'];
    const hasAllSheets = expectedSheets.every((name) => workbook.SheetNames.includes(name));
    results.push({
      test: '3 Required Sheets',
      passed: hasAllSheets,
      message: hasAllSheets
        ? `Found: ${workbook.SheetNames.join(', ')}`
        : `Missing sheets. Found: ${workbook.SheetNames.join(', ')}`,
    });

    // Test 2: Parts sheet structure
    const partsSheet = workbook.Sheets['Parts'];
    if (partsSheet) {
      const partsData = XLSX.utils.sheet_to_json(partsSheet, { header: 1 }) as any[][];
      const partsHeaders = partsData[0] || [];
      const hasHiddenCols = partsHeaders.includes('_id') && partsHeaders.includes('_tenant_id');
      const hasVisibleCols =
        partsHeaders.includes('ACR_SKU') && partsHeaders.includes('Part_Type');

      results.push({
        test: 'Parts Sheet Structure',
        passed: hasHiddenCols && hasVisibleCols,
        message: hasHiddenCols && hasVisibleCols
          ? `Headers: ${partsHeaders.join(', ')}`
          : `Missing columns. Found: ${partsHeaders.join(', ')}`,
      });

      // Check if hidden columns are properly set using ExcelJS
      const excelJSPartsSheet = excelJSWorkbook.getWorksheet('Parts');
      const idColumn = excelJSPartsSheet?.getColumn(1); // _id is first column
      const tenantColumn = excelJSPartsSheet?.getColumn(2); // _tenant_id is second column
      const isHidden = idColumn?.hidden === true && tenantColumn?.hidden === true;

      results.push({
        test: 'Hidden Columns (_id, _tenant_id)',
        passed: isHidden,
        message: isHidden
          ? '✓ Columns properly hidden'
          : `✗ Columns not hidden (id=${idColumn?.hidden}, tenant=${tenantColumn?.hidden})`,
      });

      results.push({
        test: 'Parts Row Count',
        passed: partsData.length - 1 === stats.parts,
        message: `${partsData.length - 1} rows (expected ${stats.parts})`,
      });
    }

    // Test 3: Vehicle Applications sheet structure
    const vehiclesSheet = workbook.Sheets['Vehicle Applications'];
    if (vehiclesSheet) {
      const vehiclesData = XLSX.utils.sheet_to_json(vehiclesSheet, { header: 1 }) as any[][];
      const vehiclesHeaders = vehiclesData[0] || [];
      const hasHiddenCols =
        vehiclesHeaders.includes('_id') &&
        vehiclesHeaders.includes('_tenant_id') &&
        vehiclesHeaders.includes('_part_id');
      const hasVisibleCols =
        vehiclesHeaders.includes('Make') && vehiclesHeaders.includes('Model');

      results.push({
        test: 'Vehicle Applications Sheet',
        passed: hasHiddenCols && hasVisibleCols,
        message: hasHiddenCols && hasVisibleCols
          ? `Headers: ${vehiclesHeaders.slice(0, 6).join(', ')}...`
          : `Missing columns. Found: ${vehiclesHeaders.join(', ')}`,
      });

      results.push({
        test: 'Vehicles Row Count',
        passed: vehiclesData.length - 1 === stats.vehicles,
        message: `${vehiclesData.length - 1} rows (expected ${stats.vehicles})`,
      });
    }

    // Test 4: Cross References sheet structure
    const crossRefsSheet = workbook.Sheets['Cross References'];
    if (crossRefsSheet) {
      const crossRefsData = XLSX.utils.sheet_to_json(crossRefsSheet, { header: 1 }) as any[][];
      const crossRefsHeaders = crossRefsData[0] || [];
      const hasHiddenCols =
        crossRefsHeaders.includes('_id') &&
        crossRefsHeaders.includes('_tenant_id') &&
        crossRefsHeaders.includes('_part_id');
      const hasVisibleCols =
        crossRefsHeaders.includes('Competitor_Brand') &&
        crossRefsHeaders.includes('Competitor_SKU');

      results.push({
        test: 'Cross References Sheet',
        passed: hasHiddenCols && hasVisibleCols,
        message: hasHiddenCols && hasVisibleCols
          ? `Headers: ${crossRefsHeaders.join(', ')}`
          : `Missing columns. Found: ${crossRefsHeaders.join(', ')}`,
      });

      results.push({
        test: 'Cross-Refs Row Count',
        passed: crossRefsData.length - 1 === stats.crossRefs,
        message: `${crossRefsData.length - 1} rows (expected ${stats.crossRefs})`,
      });
    }

    // 6. Print results
    console.log('📋 Test Results:\n');
    console.log('═'.repeat(80));

    results.forEach((result) => {
      const icon = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${icon} | ${result.test.padEnd(30)} | ${result.message}`);
    });

    console.log('═'.repeat(80));

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    console.log(`\n📈 Summary: ${passed}/${total} tests passed\n`);

    if (passed === total) {
      console.log('✅ Excel export working correctly with hidden columns!');
      console.log(`\n📁 Test file saved at: ${OUTPUT_FILE}`);
      console.log('   Open the file in Excel to verify ID columns are hidden\n');
    } else {
      console.error(`❌ ${total - passed} test(s) failed`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Test suite failed:', error.message);
    console.error('\n💡 Make sure the dev server is running:');
    console.error('   npm run dev\n');
    process.exit(1);
  }
}

// Run tests
testExcelExport();
