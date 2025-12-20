/**
 * Custom Database Reset Script
 *
 * This script handles the full database reset process, including a workaround
 * for a Supabase CLI bug that fails to parse complex PL/pgSQL functions with
 * semicolons inside $$ blocks.
 *
 * Usage: npm run db:reset
 */

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const PROBLEMATIC_MIGRATION =
  "20251028000000_add_atomic_import_transaction.sql";

function log(message: string) {
  console.log(`[db:reset] ${message}`);
}

function error(message: string) {
  console.error(`[db:reset] ❌ ${message}`);
}

function runCommand(command: string, description: string): boolean {
  log(description);
  try {
    execSync(command, { stdio: "inherit", encoding: "utf-8" });
    return true;
  } catch (e) {
    return false;
  }
}

function applyMigrationViaPsql(migrationFile: string): boolean {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  if (!fs.existsSync(migrationPath)) {
    error(`Migration file not found: ${migrationPath}`);
    return false;
  }

  log(`Applying ${migrationFile} via psql (bypassing CLI parser)...`);

  // Use docker exec with piped SQL
  const result = spawnSync(
    "docker",
    ["exec", "-i", "supabase_db_acr-automotive", "psql", "-U", "postgres"],
    {
      input: fs.readFileSync(migrationPath, "utf-8"),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  if (result.status !== 0) {
    error(`Failed to apply migration: ${result.stderr}`);
    return false;
  }

  // Record the migration in schema_migrations
  const version = migrationFile.split("_")[0];
  const name = migrationFile.replace(/^\d+_/, "").replace(/\.sql$/, "");

  const recordResult = spawnSync(
    "docker",
    [
      "exec",
      "supabase_db_acr-automotive",
      "psql",
      "-U",
      "postgres",
      "-c",
      `INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('${version}', '${name}', NULL) ON CONFLICT DO NOTHING;`,
    ],
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
  );

  if (recordResult.status !== 0) {
    error(`Failed to record migration: ${recordResult.stderr}`);
    return false;
  }

  log(`✅ Applied and recorded ${migrationFile}`);
  return true;
}

async function main() {
  console.log("\n🔄 ACR Automotive Database Reset\n");
  console.log("━".repeat(50));

  // Step 1: Run supabase db reset (will fail on problematic migration)
  log("Running supabase db reset...");
  const resetResult = spawnSync("npx", ["supabase", "db", "reset"], {
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
  });

  // Check if reset succeeded or failed on our known problematic migration
  const output = (resetResult.stdout || "") + (resetResult.stderr || "");
  const failedOnKnownMigration = output.includes(PROBLEMATIC_MIGRATION);

  if (resetResult.status === 0) {
    log("✅ Database reset completed successfully!");
    console.log(
      "\n⚠️  Run `npm run db:restore-snapshot` to restore your data.\n"
    );
    return;
  }

  if (!failedOnKnownMigration) {
    error("Reset failed on an unknown migration. Check the error above.");
    process.exit(1);
  }

  // Step 2: Apply problematic migration manually
  log(`Reset failed on ${PROBLEMATIC_MIGRATION} (known CLI bug)`);
  log("Applying remaining migrations manually...\n");

  // Get list of migrations that need to be applied
  const allMigrations = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql") && /^\d{14}_/.test(f))
    .sort();

  // Find which migrations still need to be applied
  const checkResult = spawnSync(
    "docker",
    [
      "exec",
      "supabase_db_acr-automotive",
      "psql",
      "-U",
      "postgres",
      "-t",
      "-c",
      "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;",
    ],
    { encoding: "utf-8" }
  );

  const appliedVersions = new Set(
    (checkResult.stdout || "")
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean)
  );

  const pendingMigrations = allMigrations.filter((m) => {
    const version = m.split("_")[0];
    return !appliedVersions.has(version);
  });

  if (pendingMigrations.length === 0) {
    log("✅ All migrations already applied!");
    console.log(
      "\n⚠️  Run `npm run db:restore-snapshot` to restore your data.\n"
    );
    return;
  }

  log(`Found ${pendingMigrations.length} pending migrations:`);
  pendingMigrations.forEach((m) => console.log(`  - ${m}`));
  console.log();

  // Apply each pending migration via psql
  for (const migration of pendingMigrations) {
    if (!applyMigrationViaPsql(migration)) {
      error(`Failed to apply ${migration}`);
      process.exit(1);
    }
  }

  console.log("\n" + "━".repeat(50));
  log("✅ Database reset completed successfully!");
  console.log(
    "\n⚠️  Run `npm run db:restore-snapshot` to restore your data.\n"
  );
}

main().catch((e) => {
  error(e.message);
  process.exit(1);
});
