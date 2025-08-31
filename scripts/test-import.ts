/**
 * Test Import Functions - Uses test schema instead of production
 * Safe for testing without affecting production data
 */

import { mapPrecios_ACRSkus_ToDatabase } from "@/lib/supabase/mappers";
import { testSupabase } from "./test-client";
import { PreciosResult, CrossReference } from "@/lib/excel/types";
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
