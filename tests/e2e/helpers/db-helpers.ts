/**
 * E2E Database Snapshot Helpers
 *
 * Provides snapshot/restore for E2E test isolation.
 * Uses Supabase service role client directly (no test setup dependency).
 * Pattern adapted from tests/helpers/test-snapshot.ts.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const E2E_SNAPSHOT_MARKER = "__E2E_TEST_SNAPSHOT__";

let client: SupabaseClient | null = null;

/** Get or create Supabase service role client for E2E tests. */
export function getE2EClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/**
 * Create a snapshot of current database state.
 * Returns a snapshot ID that can be used to restore later.
 */
export async function createE2ESnapshot(): Promise<string> {
  const supabase = getE2EClient();

  // Fetch all data
  const [parts, vehicleApps, crossRefs, aliases] = await Promise.all([
    supabase.from("parts").select("*"),
    supabase.from("vehicle_applications").select("*"),
    supabase.from("cross_references").select("*"),
    supabase.from("vehicle_aliases").select("*"),
  ]);

  const snapshotData = {
    parts: parts.data || [],
    vehicle_applications: vehicleApps.data || [],
    cross_references: crossRefs.data || [],
    vehicle_aliases: aliases.data || [],
  };

  // Save to import_history with E2E marker
  const { data, error } = await supabase
    .from("import_history")
    .insert({
      file_name: E2E_SNAPSHOT_MARKER,
      file_size_bytes: 0,
      rows_imported: snapshotData.parts.length,
      snapshot_data: snapshotData,
      import_summary: { adds: 0, updates: 0, deletes: 0 },
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create E2E snapshot: ${error.message}`);
  }

  return data!.id;
}

/**
 * Restore database to a previous snapshot state.
 */
export async function restoreE2ESnapshot(snapshotId: string): Promise<void> {
  const supabase = getE2EClient();

  const { data: snapshots, error: fetchError } = await supabase
    .from("import_history")
    .select("snapshot_data")
    .eq("id", snapshotId)
    .eq("file_name", E2E_SNAPSHOT_MARKER);

  if (fetchError || !snapshots?.length) {
    throw new Error("E2E snapshot not found");
  }

  const snap = snapshots[0].snapshot_data;

  // Delete all (reverse FK order)
  await supabase
    .from("cross_references")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase
    .from("vehicle_applications")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase
    .from("vehicle_aliases")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase
    .from("parts")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  // Restore (FK order)
  if (snap.parts?.length) {
    const { error } = await supabase.from("parts").insert(snap.parts);
    if (error) throw new Error(`Failed to restore parts: ${error.message}`);
  }
  if (snap.vehicle_applications?.length) {
    const { error } = await supabase
      .from("vehicle_applications")
      .insert(snap.vehicle_applications);
    if (error) throw new Error(`Failed to restore VAs: ${error.message}`);
  }
  if (snap.cross_references?.length) {
    const { error } = await supabase
      .from("cross_references")
      .insert(snap.cross_references);
    if (error) throw new Error(`Failed to restore CRs: ${error.message}`);
  }
  if (snap.vehicle_aliases?.length) {
    const { error } = await supabase
      .from("vehicle_aliases")
      .insert(snap.vehicle_aliases);
    if (error)
      throw new Error(`Failed to restore aliases: ${error.message}`);
  }
}

/** Delete E2E snapshot from import_history. */
export async function deleteE2ESnapshot(snapshotId: string): Promise<void> {
  const supabase = getE2EClient();
  await supabase
    .from("import_history")
    .delete()
    .eq("id", snapshotId)
    .eq("file_name", E2E_SNAPSHOT_MARKER);
}

/** Also clean up any import_history entries created during E2E tests. */
export async function cleanupE2EImports(): Promise<void> {
  const supabase = getE2EClient();
  // Delete test snapshots
  await supabase
    .from("import_history")
    .delete()
    .eq("file_name", E2E_SNAPSHOT_MARKER);
  // Delete imports from test files
  await supabase
    .from("import_history")
    .delete()
    .like("file_name", "test-%.xlsx");
}
