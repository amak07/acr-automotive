/**
 * Test Import Functions - Uses test schema instead of production
 * Safe for testing without affecting production data
 */

import { mapPrecios_ACRSkus_ToDatabase } from "@/lib/supabase/mappers";
import { testSupabase } from "./test-client";
import { PreciosResult, CrossReference, CatalogacionResult, VehicleApplication } from "@/lib/excel/types";
import { DatabaseCrossRef, DatabasePartRow } from "@/lib/supabase/utils";

/**
 * Test version of importAcrSkusAsParts - uses test schema
 */
export async function testImportAcrSkusAsParts(
  preciosResult: PreciosResult
): Promise<DatabasePartRow[]> {
  console.log("🧪 [TEST] Importing ACR SKUs to test.parts table...");

  const { parts } = mapPrecios_ACRSkus_ToDatabase(preciosResult);

  const importedParts = await testSupabase.from("parts").insert(parts).select();

  if (importedParts.error) {
    throw new Error(`Failed to insert parts: ${importedParts.error.message}`);
  }

  if (!importedParts.data) {
    throw new Error("No data returned from parts insert");
  }

  console.log(
    `✅ [TEST] Inserted ${importedParts.data.length} parts to test schema`
  );
  return importedParts.data as DatabasePartRow[];
}

/**
 * Test version of importCrossReferences - uses test schema
 */
export async function testImportCrossReferences(
  crossReferences: CrossReference[],
  insertedParts: DatabasePartRow[]
): Promise<any[]> {
  console.log(
    "🧪 [TEST] Importing cross-references to test.cross_references table..."
  );

  const partIdMap = new Map<string, string>();
  insertedParts.forEach((item) => {
    partIdMap.set(item.acr_sku, item.id);
  });

  const databaseCrossRefs: DatabaseCrossRef[] = [];
  const crossRefSet = new Set<string>(); // Track unique combinations
  let skippedLongSkus = 0;
  let skippedDuplicates = 0;

  crossReferences.forEach((item) => {
    const partId = partIdMap.get(item.acrSku);
    if (!partId) {
      throw new Error(
        `Cross-reference ACR SKU "${item.acrSku}" not found in inserted parts`
      );
    }

    // Skip competitor SKUs that are too long for current database schema
    if (item.competitorSku.length > 50) {
      skippedLongSkus++;
      console.warn(
        `⚠️  [TEST] Skipping long competitor SKU (${
          item.competitorSku.length
        } chars): "${item.competitorSku.substring(0, 50)}..."`
      );
      return;
    }

    // Create unique key to detect duplicates
    const uniqueKey = `${partId}|${item.competitorSku}`;
    if (crossRefSet.has(uniqueKey)) {
      skippedDuplicates++;
      return; // Skip duplicate
    }
    crossRefSet.add(uniqueKey);

    const dbCrossRef: DatabaseCrossRef = {
      acr_part_id: partId,
      competitor_sku: item.competitorSku,
      competitor_brand: item.competitorBrand,
    };
    databaseCrossRefs.push(dbCrossRef);
  });

  if (skippedLongSkus > 0 || skippedDuplicates > 0) {
    console.log(
      `📊 [TEST] Skipped ${skippedLongSkus} cross-references with long SKUs (>50 chars)`
    );
    if (skippedDuplicates > 0) {
      console.log(
        `📊 [TEST] Skipped ${skippedDuplicates} duplicate cross-references (data entry cleanup)`
      );
    }
    console.log(
      `📊 [TEST] Importing ${databaseCrossRefs.length} unique cross-references to test schema`
    );
  }

  const importedCrossRefs = await testSupabase
    .from("cross_references")
    .insert(databaseCrossRefs)
    .select();

  if (importedCrossRefs.error) {
    throw new Error(
      `Failed to insert cross_reference: ${importedCrossRefs.error.message}`
    );
  }

  if (!importedCrossRefs.data) {
    throw new Error("No data returned from cross_reference insert");
  }

  console.log(
    `✅ [TEST] Inserted ${importedCrossRefs.data.length} cross-references to test schema`
  );
  return importedCrossRefs.data;
}

/**
 * Test version of importPreciosData - orchestrates test imports
 */
export async function testImportPreciosData(preciosResult: PreciosResult) {
  console.log("🧪 [TEST] Starting PRECIOS data import to test schema...");

  const insertedParts = await testImportAcrSkusAsParts(preciosResult);

  const { crossRefs } = mapPrecios_ACRSkus_ToDatabase(preciosResult);
  const insertedCrossRefs = await testImportCrossReferences(
    crossRefs,
    insertedParts
  );

  console.log("✅ [TEST] PRECIOS data import complete");
  return {
    parts: insertedParts,
    crossReferences: insertedCrossRefs,
  };
}

/**
 * Test version of importVehicleApplications - uses test schema
 */
export async function testImportVehicleApplications(
  applications: VehicleApplication[],
  existingParts: DatabasePartRow[]
): Promise<any[]> {
  console.log("🧪 [TEST] Importing vehicle applications to test.vehicle_applications table...");

  // Create lookup map for ACR SKU -> Part ID
  const partIdMap = new Map<string, string>();
  existingParts.forEach((part) => {
    partIdMap.set(part.acr_sku, part.id);
  });

  // Transform vehicle applications to database format with duplicate detection
  const databaseApplications: Array<{
    part_id: string;
    make: string;
    model: string;
    year_range: string;
  }> = [];
  const applicationSet = new Set<string>(); // Track unique combinations
  let skippedOrphaned = 0;
  let skippedDuplicates = 0;

  applications.forEach((app) => {
    const partId = partIdMap.get(app.acrSku);
    if (!partId) {
      skippedOrphaned++;
      console.warn(`⚠️  [TEST] Skipping application for orphaned ACR SKU: ${app.acrSku}`);
      return;
    }

    // Create unique key for this part-vehicle combination
    const uniqueKey = `${partId}|${app.make}|${app.model}|${app.yearRange}`;
    if (applicationSet.has(uniqueKey)) {
      skippedDuplicates++;
      return; // Skip duplicate application
    }
    applicationSet.add(uniqueKey);

    databaseApplications.push({
      part_id: partId,
      make: app.make,
      model: app.model, 
      year_range: app.yearRange,
    });
  });

  if (skippedOrphaned > 0) {
    console.log(`📊 [TEST] Skipped ${skippedOrphaned} applications for orphaned ACR SKUs`);
  }
  if (skippedDuplicates > 0) {
    console.log(`📊 [TEST] Skipped ${skippedDuplicates} duplicate vehicle applications`);
  }
  console.log(`📊 [TEST] Importing ${databaseApplications.length} unique vehicle applications to test schema`);

  // Insert vehicle applications
  const result = await testSupabase
    .from("vehicle_applications")
    .insert(databaseApplications)
    .select();

  if (result.error) {
    throw new Error(`Failed to insert vehicle applications: ${result.error.message}`);
  }

  if (!result.data) {
    throw new Error("No data returned from vehicle applications insert");
  }

  console.log(`✅ [TEST] Inserted ${result.data.length} vehicle applications to test schema`);
  return result.data;
}

/**
 * Test version of updatePartDetails - uses test schema
 */
export async function testUpdatePartDetails(
  catalogacionResult: CatalogacionResult,
  existingParts: DatabasePartRow[]
): Promise<void> {
  console.log("🧪 [TEST] Updating part details in test.parts table...");

  // Create lookup map for ACR SKU -> Part ID
  const partIdMap = new Map<string, string>();
  existingParts.forEach((part) => {
    partIdMap.set(part.acr_sku, part.id);
  });

  // Group part data by ACR SKU (take first occurrence for each)
  const partDetailsMap = new Map<string, any>();
  catalogacionResult.parts.forEach((part) => {
    if (!partDetailsMap.has(part.acrSku)) {
      partDetailsMap.set(part.acrSku, {
        part_type: part.partType || null,
        position_type: part.position || null,
        abs_type: part.absType || null, 
        bolt_pattern: part.boltPattern || null,
        drive_type: part.driveType || null,
        specifications: part.specifications || null,
      });
    }
  });

  // Update parts in batches
  let updateCount = 0;
  for (const [acrSku, details] of partDetailsMap) {
    const partId = partIdMap.get(acrSku);
    if (!partId) {
      continue; // Skip orphaned SKUs
    }

    const result = await testSupabase
      .from("parts")
      .update(details)
      .eq("id", partId);

    if (result.error) {
      console.error(`❌ [TEST] Failed to update part ${acrSku}:`, result.error);
      console.error(`    Details:`, JSON.stringify(details, null, 2));
    } else {
      updateCount++;
    }
  }

  console.log(`📊 [TEST] Updated ${updateCount} parts with CATALOGACION details in test schema`);
}

/**
 * Test version of importCatalogacionData - orchestrates test imports
 */
export async function testImportCatalogacionData(
  catalogacionResult: CatalogacionResult,
  existingParts: DatabasePartRow[]
) {
  console.log("🧪 [TEST] Starting CATALOGACION data import to test schema...");

  // Step 1: Update part details
  await testUpdatePartDetails(catalogacionResult, existingParts);

  // Step 2: Import vehicle applications
  const insertedApplications = await testImportVehicleApplications(
    catalogacionResult.applications,
    existingParts
  );

  console.log("✅ [TEST] CATALOGACION import completed successfully");

  return {
    updatedParts: catalogacionResult.parts.length,
    insertedApplications: insertedApplications.length,
    orphanedSkus: catalogacionResult.orphanedApplications,
  };
}
