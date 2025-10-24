/**
 * Analyze downloaded Excel export
 *
 * This script reads the latest export file and displays:
 * - Sheet structure (row counts, column info)
 * - Hidden vs visible columns
 * - Sample data from each sheet
 */

import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

async function analyzeExport() {
  console.log('📊 Analyzing Excel Export...\n');

  // Find the most recent export file in tmp/
  const tmpDir = path.join(process.cwd(), 'tmp');
  const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('acr-catalog-export-') || f.startsWith('acr-filtered-export-'));

  if (files.length === 0) {
    console.error('❌ No export files found in tmp/ directory');
    console.error('   Expected files matching: acr-catalog-export-*.xlsx or acr-filtered-export-*.xlsx');
    process.exit(1);
  }

  // Get the most recent file
  const filePath = path.join(tmpDir, files[files.length - 1]);
  const fileStats = fs.statSync(filePath);
  const fileSizeKB = Math.round(fileStats.size / 1024);

  console.log(`File: ${filePath}`);
  console.log(`Size: ${fileSizeKB} KB`);
  console.log(`Modified: ${fileStats.mtime.toLocaleString()}\n`);

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Analyze each sheet
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Sheet ${sheetId}: ${worksheet.name}`);
      console.log('='.repeat(80));

      // Get row count
      const rowCount = worksheet.rowCount;
      console.log(`Rows: ${rowCount} (including header)`);
      console.log(`Data rows: ${rowCount - 1}`);

      // Get columns info
      console.log(`\nColumns:`);
      worksheet.columns.forEach((col, index) => {
        const hiddenStatus = col.hidden ? '🔒 HIDDEN' : '👁️  VISIBLE';
        console.log(`  ${hiddenStatus} | ${col.header || '(unnamed)'} (width: ${col.width})`);
      });

      // Get header row to map column names to positions
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value?.toString() || '';
      });

      // Sample first 3 data rows with labeled values
      console.log(`\nSample Data (first 3 rows):`);
      for (let i = 2; i <= Math.min(4, rowCount); i++) {
        const row = worksheet.getRow(i);
        const rowData: any = {};

        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            rowData[header] = cell.value || '(empty)';
          }
        });

        console.log(`\n  Row ${i}:`);
        Object.entries(rowData).forEach(([key, value]) => {
          // Truncate long values
          const displayValue = typeof value === 'string' && value.length > 50
            ? value.substring(0, 47) + '...'
            : value;
          console.log(`    ${key}: ${displayValue}`);
        });
      }

      console.log('\n');
    });

    console.log('='.repeat(80));
    console.log('\n✅ Analysis complete!');
  } catch (error: any) {
    console.error('❌ Error analyzing file:', error.message);
    process.exit(1);
  }
}

analyzeExport();
