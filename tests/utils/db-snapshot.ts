/**
 * Database Snapshot Utilities
 *
 * Provides dynamic database count helpers for tests.
 * Instead of hardcoding expected counts, tests should query actual DB state.
 *
 * This makes tests resilient to database reseeding and data changes.
 *
 * Usage:
 *   const counts = await getDbCounts();
 *   expect(result.parts.length).toBe(counts.parts);
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load test environment (local Docker)
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials for test database");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Database counts returned by getDbCounts()
 */
export interface DbCounts {
  parts: number;
  vehicleApplications: number;
  crossReferences: number;
  total: number;
}

/**
 * Get current record counts from the database
 *
 * @returns Object with counts for parts, vehicleApplications, crossReferences, and total
 */
export async function getDbCounts(): Promise<DbCounts> {
  const [partsResult, vaResult, crResult] = await Promise.all([
    supabase.from("parts").select("*", { count: "exact", head: true }),
    supabase
      .from("vehicle_applications")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("cross_references")
      .select("*", { count: "exact", head: true }),
  ]);

  if (partsResult.error) {
    throw new Error(`Failed to count parts: ${partsResult.error.message}`);
  }
  if (vaResult.error) {
    throw new Error(
      `Failed to count vehicle applications: ${vaResult.error.message}`
    );
  }
  if (crResult.error) {
    throw new Error(
      `Failed to count cross references: ${crResult.error.message}`
    );
  }

  const parts = partsResult.count || 0;
  const vehicleApplications = vaResult.count || 0;
  const crossReferences = crResult.count || 0;

  return {
    parts,
    vehicleApplications,
    crossReferences,
    total: parts + vehicleApplications + crossReferences,
  };
}

/**
 * Verify database is not empty (has baseline data)
 *
 * @throws Error if database appears empty
 */
export async function verifyDbHasData(): Promise<void> {
  const counts = await getDbCounts();

  if (counts.parts === 0) {
    throw new Error(
      "Test database is empty! Run `npm run db:test:reset` to load baseline data."
    );
  }
}

/**
 * Get database snapshot for integration tests
 *
 * Returns all data for snapshot comparisons
 */
export async function getDbSnapshot() {
  const [partsResult, vaResult, crResult] = await Promise.all([
    supabase.from("parts").select("*"),
    supabase.from("vehicle_applications").select("*"),
    supabase.from("cross_references").select("*"),
  ]);

  if (partsResult.error) {
    throw new Error(`Failed to fetch parts: ${partsResult.error.message}`);
  }
  if (vaResult.error) {
    throw new Error(
      `Failed to fetch vehicle applications: ${vaResult.error.message}`
    );
  }
  if (crResult.error) {
    throw new Error(
      `Failed to fetch cross references: ${crResult.error.message}`
    );
  }

  return {
    parts: partsResult.data || [],
    vehicleApplications: vaResult.data || [],
    crossReferences: crResult.data || [],
  };
}
