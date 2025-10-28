/**
 * Debug E8 fixture parsing
 */
import * as fs from "fs";
import * as path from "path";
import { ExcelImportService } from "../../src/services/excel/import/ExcelImportService";
import { loadFixture } from "./helpers/fixture-loader";

async function debugE8Fixture() {
  console.log("🔍 Debugging E8 fixture parsing...\n");

  const file = loadFixture("error-invalid-formats.xlsx");
  const parser = new ExcelImportService();
  const parsed = await parser.parseFile(file);

  console.log("=== PARSED VEHICLE APPLICATIONS ===");
  parsed.vehicleApplications.data.forEach((v, i) => {
    console.log(`\nRow ${i + 2}:`, {
      _id: v._id,
      _part_id: v._part_id,
      acr_sku: v.acr_sku,
      make: v.make,
      model: v.model,
      start_year: v.start_year,
      end_year: v.end_year,
      start_year_type: typeof v.start_year,
      end_year_type: typeof v.end_year,
    });
  });

  console.log("\n=== PARSED PARTS ===");
  parsed.parts.data.forEach((p, i) => {
    console.log(`\nRow ${i + 2}:`, {
      _id: p._id,
      acr_sku: p.acr_sku,
      part_type: p.part_type,
      position_type: p.position_type,
    });
  });
}

debugE8Fixture().catch(console.error);
