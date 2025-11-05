import { ExcelImportService } from '../src/services/excel/import/ExcelImportService';
import { ValidationEngine } from '../src/services/excel/validation/ValidationEngine';
import { loadFixture, seedDbState } from './test/helpers/fixture-loader';

(async () => {
  const parser = new ExcelImportService();
  const validator = new ValidationEngine();

  const file = loadFixture('warning-data-changes.xlsx');
  const parsed = await parser.parseFile(file);
  const result = await validator.validate(parsed, seedDbState());

  console.log('Validation result:');
  console.log('  valid:', result.valid);
  console.log('  errors:', result.errors.length);
  console.log('  warnings:', result.warnings.length);

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach((e, i) => {
      console.log(`  ${i+1}. [${e.code}] ${e.message} (sheet: ${e.sheet}, row: ${e.row})`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach((w, i) => {
      console.log(`  ${i+1}. [${w.code}] ${w.message}`);
    });
  }
})();
