const xlsx = require('xlsx');
const path = require('path');

// ============================================================================
// Fix error-missing-required-fields.xlsx
// ============================================================================
console.log('📝 Fixing error-missing-required-fields.xlsx...');

const fixturePath = path.join(__dirname, '../fixtures/excel/unit/error-missing-required-fields.xlsx');
const wb = xlsx.readFile(fixturePath);

// Vehicle Applications sheet - add rows with missing required fields
const vaData = [
  {
    '_id': '',
    '_part_id': '',
    'ACR_SKU': '',  // Missing ACR_SKU
    'Make': 'Honda',
    'Model': 'Civic',
    'Start_Year': 2020,
    'End_Year': 2023
  },
  {
    '_id': '',
    '_part_id': '',
    'ACR_SKU': 'ACR-VALID-001',
    'Make': '',  // Missing Make
    'Model': 'CR-V',
    'Start_Year': 2019,
    'End_Year': 2022
  },
  {
    '_id': '',
    '_part_id': '',
    'ACR_SKU': 'ACR-VALID-002',
    'Make': 'Toyota',
    'Model': '',  // Missing Model
    'Start_Year': 2018,
    'End_Year': 2021
  }
];

// Cross References sheet - add rows with missing required fields
const crData = [
  {
    '_id': '',
    '_acr_part_id': '',
    'ACR_SKU': '',  // Missing ACR_SKU
    'Competitor_Brand': 'Brembo',
    'Competitor_SKU': 'BR-12345'
  },
  {
    '_id': '',
    '_acr_part_id': '',
    'ACR_SKU': 'ACR-VALID-001',
    'Competitor_Brand': '',  // Missing Competitor_Brand
    'Competitor_SKU': 'ATE-67890'
  },
  {
    '_id': '',
    '_acr_part_id': '',
    'ACR_SKU': 'ACR-VALID-002',
    'Competitor_Brand': 'Wagner',
    'Competitor_SKU': ''  // Missing Competitor_SKU
  }
];

// Update Vehicle Applications sheet
const vaSheet = xlsx.utils.json_to_sheet(vaData);
wb.Sheets['Vehicle Applications'] = vaSheet;

// Update Cross References sheet
const crSheet = xlsx.utils.json_to_sheet(crData);
wb.Sheets['Cross References'] = crSheet;

// Save the updated file
xlsx.writeFile(wb, fixturePath);
console.log('✅ Fixed error-missing-required-fields.xlsx');

// ============================================================================
// Fix error-orphaned-references.xlsx
// ============================================================================
console.log('\n📝 Fixing error-orphaned-references.xlsx...');

const orphanedFixturePath = path.join(__dirname, '../fixtures/excel/unit/error-orphaned-references.xlsx');
const wb2 = xlsx.readFile(orphanedFixturePath);

// Read existing Parts data to see what SKUs exist
const existingParts = xlsx.utils.sheet_to_json(wb2.Sheets['Parts']);
console.log('   Existing parts:', existingParts.map(p => p.ACR_SKU).join(', '));

// Vehicle Applications - add rows with orphaned _part_id
const vaOrphanedData = xlsx.utils.sheet_to_json(wb2.Sheets['Vehicle Applications']);
// Add a row with non-existent _part_id
vaOrphanedData.push({
  '_id': '',
  '_part_id': 'non-existent-part-uuid-12345',  // Orphaned reference
  'ACR_SKU': 'ACR-NONEXISTENT',  // Non-existent SKU
  'Make': 'Honda',
  'Model': 'Civic',
  'Start_Year': 2020,
  'End_Year': 2023
});

// Cross References - add rows with orphaned _acr_part_id
const crOrphanedData = xlsx.utils.sheet_to_json(wb2.Sheets['Cross References']);
// Add a row with non-existent _acr_part_id
crOrphanedData.push({
  '_id': '',
  '_acr_part_id': 'non-existent-acr-part-uuid-67890',  // Orphaned reference
  'ACR_SKU': 'ACR-INVALID',  // Non-existent SKU
  'Competitor_Brand': 'Brembo',
  'Competitor_SKU': 'BR-ORPHANED'
});

// Update sheets
const vaOrphanedSheet = xlsx.utils.json_to_sheet(vaOrphanedData);
wb2.Sheets['Vehicle Applications'] = vaOrphanedSheet;

const crOrphanedSheet = xlsx.utils.json_to_sheet(crOrphanedData);
wb2.Sheets['Cross References'] = crOrphanedSheet;

// Save
xlsx.writeFile(wb2, orphanedFixturePath);
console.log('✅ Fixed error-orphaned-references.xlsx');

// ============================================================================
// Check warning-data-changes.xlsx
// ============================================================================
console.log('\n📝 Checking warning-data-changes.xlsx...');

const warningFixturePath = path.join(__dirname, '../fixtures/excel/unit/warning-data-changes.xlsx');
const wb3 = xlsx.readFile(warningFixturePath);

const warningParts = xlsx.utils.sheet_to_json(wb3.Sheets['Parts']);
const warningVA = xlsx.utils.sheet_to_json(wb3.Sheets['Vehicle Applications']);
const warningCR = xlsx.utils.sheet_to_json(wb3.Sheets['Cross References']);

console.log('   Parts:', warningParts.length, 'rows');
console.log('   Vehicle Applications:', warningVA.length, 'rows');
console.log('   Cross References:', warningCR.length, 'rows');

// Check for any empty required fields that would cause validation errors
let hasErrors = false;

warningParts.forEach((part, i) => {
  if (!part.ACR_SKU || !part.Part_Type) {
    console.log(`   ⚠️  Part row ${i+1} missing required fields:`, part);
    hasErrors = true;
  }
});

warningVA.forEach((va, i) => {
  if (!va.ACR_SKU || !va.Make || !va.Model) {
    console.log(`   ⚠️  VA row ${i+1} missing required fields:`, va);
    hasErrors = true;
  }
});

warningCR.forEach((cr, i) => {
  if (!cr.ACR_SKU || !cr.Competitor_SKU) {
    console.log(`   ⚠️  CR row ${i+1} missing required fields:`, cr);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.log('   ❌ This fixture has validation errors - needs fixing');
  console.log('   💡 All fields should be populated to generate only warnings, not errors');
} else {
  console.log('✅ warning-data-changes.xlsx looks good (no missing required fields)');
}

console.log('\n🎉 Fixture fixes complete!');
