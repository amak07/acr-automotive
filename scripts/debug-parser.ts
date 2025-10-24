/**
 * Debug Excel Parser
 * Check what data is being parsed from the Excel file
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExcelImportService } from '../src/services/excel/import/ExcelImportService';

const TEST_FILE = path.join(process.cwd(), 'tmp', 'test-export.xlsx');

async function debugParser() {
  console.log('🔍 Debugging Excel Parser\n');

  const fileBuffer = fs.readFileSync(TEST_FILE);
  const file = new File([fileBuffer], 'test-export.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const importService = new ExcelImportService();
  const parsed = await importService.parseFile(file);

  console.log('Parts - First Row:');
  console.log(JSON.stringify(parsed.parts.data[0], null, 2));

  console.log('\nVehicle Applications - First Row:');
  console.log(JSON.stringify(parsed.vehicleApplications.data[0], null, 2));

  console.log('\nCross References - First Row:');
  console.log(JSON.stringify(parsed.crossReferences.data[0], null, 2));
}

debugParser();