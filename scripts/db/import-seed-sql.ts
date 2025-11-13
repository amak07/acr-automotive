#!/usr/bin/env tsx
/**
 * Import Seed Data from SQL File (Cross-Platform)
 *
 * This script imports fixtures/seed-data.sql into the local Supabase database
 * without requiring psql to be installed. Works on Windows, Mac, and Linux.
 *
 * Usage:
 *   npm run db:import-seed
 */

import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

async function importSeedData() {
  const sqlPath = path.join(process.cwd(), 'fixtures', 'seed-data.sql');

  console.log('📂 Reading SQL file...');

  // Check if file exists
  try {
    await fs.access(sqlPath);
  } catch (error) {
    console.error(`❌ File not found: ${sqlPath}`);
    console.log('\n💡 Generate the file first with:');
    console.log('   npm run staging:export');
    process.exit(1);
  }

  // Read SQL file
  const sqlContent = await fs.readFile(sqlPath, 'utf-8');

  console.log('🔄 Connecting to local Supabase database...');

  // Connect directly to PostgreSQL (port 54322, not 54321 which is API)
  const client = new Client({
    host: 'localhost',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected!');

    console.log('📥 Importing data...');

    // Execute the SQL file
    await client.query(sqlContent);

    console.log('✅ Data imported successfully!');

    // Get counts
    const partsResult = await client.query('SELECT COUNT(*) FROM parts');
    const vehiclesResult = await client.query('SELECT COUNT(*) FROM vehicle_applications');
    const crossRefsResult = await client.query('SELECT COUNT(*) FROM cross_references');

    console.log('\n📊 Database Summary:');
    console.log(`   Parts: ${partsResult.rows[0].count}`);
    console.log(`   Vehicle Applications: ${vehiclesResult.rows[0].count}`);
    console.log(`   Cross References: ${crossRefsResult.rows[0].count}`);
    console.log(`   Total Records: ${parseInt(partsResult.rows[0].count) + parseInt(vehiclesResult.rows[0].count) + parseInt(crossRefsResult.rows[0].count)}`);

    console.log('\n💡 Tip: Run "npm run db:save-snapshot" to save this as your baseline');

  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the import
importSeedData()
  .then(() => {
    console.log('\n✅ Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
