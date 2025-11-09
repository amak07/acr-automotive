const xlsx = require('xlsx');
const path = require('path');

console.log('📝 Regenerating warning-data-changes.xlsx to match seedDbState...');

const fixturePath = path.join(__dirname, '../fixtures/excel/unit/warning-data-changes.xlsx');

// Create workbook
const wb = xlsx.utils.book_new();

// Parts sheet - with changes that trigger warnings
// NOTE: Updated to use "ACR-SEED-" prefix per Migration 009 SKU normalization requirement
const partsData = [
  {
    '_id': '00000000-0000-0000-0000-000000000001',
    'ACR_SKU': 'ACR-SEED-001-CHANGED',  // W1: ACR_SKU changed from ACR-SEED-001
    'Part_Type': 'Rotor',
    'Position_Type': 'Front',
    'ABS_Type': 'ABS',
    'Bolt_Pattern': '5x114.3',
    'Drive_Type': 'FWD',
    'Specifications': 'Diameter: 300mm'  // W7: Specifications shortened (was "Diameter: 300mm, Weight: 5kg")
  },
  {
    '_id': '00000000-0000-0000-0000-000000000002',
    'ACR_SKU': 'ACR-SEED-002',
    'Part_Type': 'Caliper',  // W3: Part_Type changed from Rotor to Caliper
    'Position_Type': 'Rear',
    'ABS_Type': 'Non-ABS',
    'Bolt_Pattern': '5x114.3',
    'Drive_Type': 'RWD',
    'Specifications': 'Diameter: 280mm'
  },
  {
    '_id': '00000000-0000-0000-0000-000000000003',
    'ACR_SKU': 'ACR-SEED-003',
    'Part_Type': 'Rotor',
    'Position_Type': 'Rear',  // W4: Position_Type changed from Front to Rear
    'ABS_Type': 'ABS',
    'Bolt_Pattern': '5x100',
    'Drive_Type': 'AWD',
    'Specifications': 'Diameter: 320mm'
  },
  {
    '_id': '00000000-0000-0000-0000-000000000004',
    'ACR_SKU': 'ACR-SEED-004',
    'Part_Type': 'Pad Set',
    'Position_Type': 'Front',
    'ABS_Type': 'ABS',
    'Bolt_Pattern': '',
    'Drive_Type': '',
    'Specifications': 'Ceramic compound'  // W7: Shortened from "Ceramic compound, high performance friction material"
  }
];

// Vehicle Applications sheet - with changes that trigger warnings
const vaData = [
  {
    '_id': '10000000-0000-0000-0000-000000000001',
    '_part_id': '00000000-0000-0000-0000-000000000001',
    'ACR_SKU': 'ACR-SEED-001-CHANGED',  // Must match the changed SKU
    'Make': 'Toyota',  // W8: Make changed from Honda to Toyota
    'Model': 'Accord',
    'Start_Year': 2010,
    'End_Year': 2012  // W2: Year range narrowed (was 2015)
  },
  {
    '_id': '10000000-0000-0000-0000-000000000002',
    '_part_id': '00000000-0000-0000-0000-000000000001',
    'ACR_SKU': 'ACR-SEED-001-CHANGED',
    'Make': 'Honda',
    'Model': 'CR-V',  // W9: Model changed from Civic to CR-V
    'Start_Year': 2010,
    'End_Year': 2011  // W2: Year range narrowed (was 2015)
  },
  {
    '_id': '10000000-0000-0000-0000-000000000003',
    '_part_id': '00000000-0000-0000-0000-000000000001',
    'ACR_SKU': 'ACR-SEED-001-CHANGED',
    'Make': 'Acura',
    'Model': 'TSX',
    'Start_Year': 2010,  // W2: Year range narrowed (was 2008)
    'End_Year': 2012  // W2: Year range narrowed (was 2014)
  }
];

// Cross References sheet - with changes that trigger warnings
const crData = [
  {
    '_id': '20000000-0000-0000-0000-000000000001',
    '_acr_part_id': '00000000-0000-0000-0000-000000000001',
    'ACR_SKU': 'ACR-SEED-001-CHANGED',  // Must match the changed SKU
    'Competitor_Brand': 'StopTech',  // W10: Competitor_Brand changed from Brembo to StopTech
    'Competitor_SKU': 'BR-09-A234'
  }
];

// Create sheets
const partsSheet = xlsx.utils.json_to_sheet(partsData);
const vaSheet = xlsx.utils.json_to_sheet(vaData);
const crSheet = xlsx.utils.json_to_sheet(crData);

// Hide ID columns (this is how the system detects exported files)
// Parts sheet: hide _id column (column A)
if (!partsSheet['!cols']) partsSheet['!cols'] = [];
partsSheet['!cols'][0] = { hidden: true };  // _id

// Vehicle Applications sheet: hide _id and _part_id columns
if (!vaSheet['!cols']) vaSheet['!cols'] = [];
vaSheet['!cols'][0] = { hidden: true };  // _id
vaSheet['!cols'][1] = { hidden: true };  // _part_id

// Cross References sheet: hide _id and _acr_part_id columns
if (!crSheet['!cols']) crSheet['!cols'] = [];
crSheet['!cols'][0] = { hidden: true };  // _id
crSheet['!cols'][1] = { hidden: true };  // _acr_part_id

// Add sheets to workbook
xlsx.utils.book_append_sheet(wb, partsSheet, 'Parts');
xlsx.utils.book_append_sheet(wb, vaSheet, 'Vehicle Applications');
xlsx.utils.book_append_sheet(wb, crSheet, 'Cross References');

// Save
xlsx.writeFile(wb, fixturePath);

console.log('✅ Regenerated warning-data-changes.xlsx');
console.log('\nExpected warnings:');
console.log('  W1: ACR_SKU changed (ACR-SEED-001 → ACR-SEED-001-CHANGED)');
console.log('  W2: Year range narrowed (multiple VAs)');
console.log('  W3: Part_Type changed (Rotor → Caliper)');
console.log('  W4: Position_Type changed (Front → Rear)');
console.log('  W7: Specifications shortened (2 parts)');
console.log('  W8: Make changed (Honda → Toyota)');
console.log('  W9: Model changed (Civic → CR-V)');
console.log('  W10: Competitor_Brand changed (Brembo → StopTech)');
