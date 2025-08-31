import { supabase } from "./client";
import { mapPrecios_ACRSkus_ToDatabase } from "./mappers";
import { PreciosResult, CrossReference } from "@/lib/excel/types";
import {
  DatabasePartRow,
  DatabaseCrossRef,
  DatabaseCrossRefRow,
} from "./utils";

/**
 * Step 1: Import ACR SKUs as minimal parts into database
 * Returns the inserted parts with their generated IDs
 *
 * @param preciosResult - Output from PreciosParser.parseFile()
 * @returns Array of inserted parts with generated IDs
 */
export async function importAcrSkusAsParts(
  preciosResult: PreciosResult
): Promise<DatabasePartRow[]> {
  // Step 1: Use mapper to transform Excel data -> Database parts
  const { parts } = mapPrecios_ACRSkus_ToDatabase(preciosResult);

  // Step 2: Insert parts into Supabase and get back the generated IDs
  const importedParts = await supabase.from("parts").insert(parts).select();

  if (importedParts.error) {
    throw new Error(`Failed to insert parts: ${importedParts.error.message}`);
  }

  // Check for data
  if (!importedParts.data) {
    throw new Error("No data returned from parts insert");
  }

  return importedParts.data as DatabasePartRow[];
}

/**
 * Step 2: Import cross-references using the inserted parts' IDs
 *
 * @param crossReferences - Raw cross-reference data from Excel
 * @param insertedParts - Parts with IDs from Step 1
 * @returns Array of inserted cross-references
 */
export async function importCrossReferences(
  crossReferences: CrossReference[],
  insertedParts: DatabasePartRow[]
): Promise<DatabaseCrossRef[]> {
  // Step 1: Create lookup map for fast part ID resolution
  const partIdMap = new Map<string, string>();
  insertedParts.forEach((item) => {
    partIdMap.set(item.acr_sku, item.id);
  });

  // Step 2: Transform cross-references to database objects
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
      console.warn(`⚠️  Skipping long competitor SKU (${item.competitorSku.length} chars): "${item.competitorSku.substring(0, 50)}..."`);
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
  
  // Log skipped count for visibility
  if (skippedLongSkus > 0 || skippedDuplicates > 0) {
    console.log(`📊 Skipped ${skippedLongSkus} cross-references with long SKUs (>50 chars)`);
    if (skippedDuplicates > 0) {
      console.log(`📊 Skipped ${skippedDuplicates} duplicate cross-references (data entry cleanup)`);
    }
    console.log(`📊 Importing ${databaseCrossRefs.length} unique cross-references`);
  }

  // Step 3: Insert into Supabase with error handling
  const importedCrossRefs = await supabase
    .from("cross_references")
    .insert(databaseCrossRefs)
    .select();

  if (importedCrossRefs.error) {
    throw new Error(
      `Failed to insert cross_reference: ${importedCrossRefs.error.message}`
    );
  }

  // Check for data
  if (!importedCrossRefs.data) {
    throw new Error("No data returned from cross_reference insert");
  }

  return importedCrossRefs.data as DatabaseCrossRefRow[];
}

/**
 * Step 3: Imports PreciosResult data into the database.
 *
 * @param preciosResult - Output from PreciosParser.parseFile()
 * @returns Array of database objects for Parts and CrossReferences
 */
export async function importPreciosData(preciosResult: PreciosResult) {
  // Step 1: Import ACR SKUs as parts
  const insertedParts = await importAcrSkusAsParts(preciosResult);

  // Step 2: Import cross-references using the part IDs
  const { crossRefs } = mapPrecios_ACRSkus_ToDatabase(preciosResult);
  const insertedCrossRefs = await importCrossReferences(
    crossRefs,
    insertedParts
  );

  return {
    parts: insertedParts,
    crossReferences: insertedCrossRefs,
  };
}
