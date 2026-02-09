/**
 * Restore production data from JSON snapshot files.
 * Uses Supabase REST API with service_role key to bypass RLS.
 *
 * Usage: node supabase/production-snapshot/restore.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.production
const envPath = path.join(__dirname, '..', '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.production');
  process.exit(1);
}

const BASE = `${SUPABASE_URL}/rest/v1`;
const DATE = '2026-02-09';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function loadSnapshot(table) {
  const filePath = path.join(__dirname, `${DATE}_${table}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function insertBatch(table, rows) {
  const res = await fetch(`${BASE}/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`INSERT ${table} failed (${res.status}): ${text}`);
  }
  return rows.length;
}

async function deleteAll(table) {
  // Delete all rows (filter that matches everything)
  const res = await fetch(`${BASE}/${table}?id=not.is.null`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${table} failed (${res.status}): ${text}`);
  }
}

async function restoreTable(table, { batchSize = 500, deleteFirst = false } = {}) {
  const rows = await loadSnapshot(table);
  console.log(`  ${table}: ${rows.length} rows to restore`);

  if (rows.length === 0) return;

  if (deleteFirst) {
    await deleteAll(table);
    console.log(`    Deleted existing rows`);
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await insertBatch(table, batch);
    inserted += batch.length;
    if (rows.length > batchSize) {
      console.log(`    ${inserted}/${rows.length}`);
    }
  }
  console.log(`    Done: ${inserted} rows inserted`);
}

async function main() {
  console.log(`Restoring production data from ${DATE} snapshot...`);
  console.log(`Target: ${SUPABASE_URL}\n`);

  // Insert order: parts first (parent), then dependent tables
  // 1. Parts (no FK deps)
  await restoreTable('parts');

  // 2. Dependent tables (FK to parts.id)
  await restoreTable('vehicle_applications');
  await restoreTable('cross_references');
  await restoreTable('part_images');
  await restoreTable('part_360_frames');

  // 3. Site settings (delete migration-seeded defaults first)
  await restoreTable('site_settings', { deleteFirst: true });

  // 4. Import history (large JSONB, insert one at a time)
  await restoreTable('import_history', { batchSize: 1 });

  console.log('\nRestore complete! Verifying row counts...\n');

  // Verify counts
  const tables = ['parts', 'vehicle_applications', 'cross_references', 'part_images', 'part_360_frames', 'site_settings', 'import_history'];
  for (const table of tables) {
    const res = await fetch(`${BASE}/${table}?select=id&limit=1`, {
      headers: {
        ...headers,
        'Prefer': 'count=exact',
      },
    });
    const count = res.headers.get('content-range')?.split('/')[1] || '?';
    console.log(`  ${table}: ${count} rows`);
  }
}

main().catch((err) => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
