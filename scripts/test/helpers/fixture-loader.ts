/**
 * Test Fixture Loader
 *
 * Helper functions to load Excel fixtures for testing
 */

import * as fs from "fs";
import * as path from "path";

const FIXTURES_DIR = path.join(process.cwd(), "fixtures", "excel");

/**
 * Load Excel fixture as File object (for testing parseFile methods)
 * Node.js compatible - adds arrayBuffer() method to File
 */
export function loadFixture(filename: string): File {
  const filepath = path.join(FIXTURES_DIR, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Fixture not found: ${filepath}`);
  }

  const buffer = fs.readFileSync(filepath);

  // Create File with arrayBuffer method for Node.js compatibility
  const file = new File([buffer], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }) as any;

  // Add arrayBuffer method for Node.js (browser File has this natively)
  if (!file.arrayBuffer) {
    file.arrayBuffer = async () => {
      // Convert Node.js Buffer to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(buffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < buffer.length; i++) {
        view[i] = buffer[i];
      }
      return arrayBuffer;
    };
  }

  return file;
}

/**
 * Load Excel fixture as Buffer (for testing low-level parsing)
 */
export function loadFixtureBuffer(filename: string): Buffer {
  const filepath = path.join(FIXTURES_DIR, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Fixture not found: ${filepath}`);
  }

  return fs.readFileSync(filepath);
}

/**
 * Get fixture path (for passing to external tools)
 */
export function getFixturePath(filename: string): string {
  return path.join(FIXTURES_DIR, filename);
}

/**
 * List all available fixtures
 */
export function listFixtures(): string[] {
  if (!fs.existsSync(FIXTURES_DIR)) {
    return [];
  }

  return fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith(".xlsx"));
}

/**
 * Create empty database state for validation tests
 * (when testing add-only scenarios with no existing data)
 */
export function emptyDbState() {
  return {
    parts: new Map(),
    vehicleApplications: new Map(),
    crossReferences: new Map(),
    partSkus: new Set<string>(),
  };
}

/**
 * Create seed database state for update/delete tests
 * (matches warning-data-changes.xlsx fixture expectations)
 */
export function seedDbState() {
  const parts = new Map();
  const vehicleApplications = new Map();
  const crossReferences = new Map();

  // Seed Parts (original values before changes in warning fixture)
  parts.set("00000000-0000-0000-0000-000000000001", {
    _id: "00000000-0000-0000-0000-000000000001",
    acr_sku: "SEED-001", // WARNING fixture changes to "SEED-001-CHANGED" (W1)
    part_type: "Rotor",
    position_type: "Front",
    abs_type: "ABS",
    bolt_pattern: "5x114.3",
    drive_type: "FWD",
    specifications: "Diameter: 300mm, Weight: 5kg", // WARNING fixture shortens to "Diameter: 300mm" (W7)
  });

  parts.set("00000000-0000-0000-0000-000000000002", {
    _id: "00000000-0000-0000-0000-000000000002",
    acr_sku: "SEED-002",
    part_type: "Rotor", // WARNING fixture changes to "Caliper" (W3)
    position_type: "Rear",
    abs_type: "Non-ABS",
    bolt_pattern: "5x114.3",
    drive_type: "RWD",
    specifications: "Diameter: 280mm",
  });

  parts.set("00000000-0000-0000-0000-000000000003", {
    _id: "00000000-0000-0000-0000-000000000003",
    acr_sku: "SEED-003",
    part_type: "Rotor",
    position_type: "Front", // WARNING fixture changes to "Rear" (W4)
    abs_type: "ABS",
    bolt_pattern: "5x100",
    drive_type: "AWD",
    specifications: "Diameter: 320mm",
  });

  parts.set("00000000-0000-0000-0000-000000000004", {
    _id: "00000000-0000-0000-0000-000000000004",
    acr_sku: "SEED-004",
    part_type: "Pad Set",
    position_type: "Front",
    abs_type: "ABS",
    bolt_pattern: null,
    drive_type: null,
    specifications: "Ceramic compound, high performance friction material", // WARNING fixture shortens (W7)
  });

  // Seed Vehicle Applications (original values)
  vehicleApplications.set("10000000-0000-0000-0000-000000000001", {
    _id: "10000000-0000-0000-0000-000000000001",
    _part_id: null,
    acr_sku: "SEED-001",
    make: "Honda", // WARNING fixture changes to "Toyota" (W8)
    model: "Accord",
    start_year: 2010,
    end_year: 2015, // WARNING fixture changes to 2012 (W2 - year range narrowed)
  });

  vehicleApplications.set("10000000-0000-0000-0000-000000000002", {
    _id: "10000000-0000-0000-0000-000000000002",
    _part_id: null,
    acr_sku: "SEED-001",
    make: "Honda",
    model: "Civic", // WARNING fixture changes to "CR-V" (W9)
    start_year: 2010,
    end_year: 2015, // WARNING fixture changes to 2011 (W2 - year range narrowed)
  });

  vehicleApplications.set("10000000-0000-0000-0000-000000000003", {
    _id: "10000000-0000-0000-0000-000000000003",
    _part_id: null,
    acr_sku: "SEED-001",
    make: "Acura",
    model: "TSX",
    start_year: 2008, // WARNING fixture changes to 2010 (W2 - year range narrowed)
    end_year: 2014, // WARNING fixture changes to 2012 (W2 - year range narrowed)
  });

  // Seed Cross References (original values)
  crossReferences.set("20000000-0000-0000-0000-000000000001", {
    _id: "20000000-0000-0000-0000-000000000001",
    _acr_part_id: null,
    acr_sku: "SEED-001",
    competitor_brand: "Brembo", // WARNING fixture changes to "StopTech" (W10)
    competitor_sku: "BR-09-A234",
  });

  return {
    parts,
    vehicleApplications,
    crossReferences,
    partSkus: new Set([
      "SEED-001",
      "SEED-002",
      "SEED-003",
      "SEED-004",
    ]),
  };
}
