#!/usr/bin/env tsx
/**
 * Import Seed Data from SQL File (Cross-Platform)
 *
 * This script imports fixtures/seed-data.sql into the local Supabase database
 * without requiring psql to be installed. Works on Windows, Mac, and Linux.
 *
 * Also creates the default admin user for local development.
 *
 * Usage:
 *   npm run db:import-seed
 */

import fs from "fs/promises";
import path from "path";
import pg from "pg";

const { Client } = pg;

// Default admin user for local development
const ADMIN_USER = {
  email: "abel.mak@acr.com",
  password: "acr2026admin",
  fullName: "Abel Mak",
  role: "admin",
  isOwner: true,
};

async function importSeedData() {
  const sqlPath = path.join(
    process.cwd(),
    "tests",
    "fixtures",
    "seed-data.sql"
  );

  console.log("📂 Reading SQL file...");

  // Check if file exists
  try {
    await fs.access(sqlPath);
  } catch (error) {
    console.error(`❌ File not found: ${sqlPath}`);
    console.log("\n💡 Generate the file first with:");
    console.log("   npm run staging:export");
    process.exit(1);
  }

  // Read SQL file
  const sqlContent = await fs.readFile(sqlPath, "utf-8");

  console.log("🔄 Connecting to local Supabase database...");

  // Connect directly to PostgreSQL (port 54322, not 54321 which is API)
  const client = new Client({
    host: "localhost",
    port: 54322,
    database: "postgres",
    user: "postgres",
    password: "postgres",
  });

  try {
    await client.connect();
    console.log("✅ Connected!");

    console.log("📥 Importing data...");

    // Execute the SQL file
    await client.query(sqlContent);

    console.log("✅ Data imported successfully!");

    // Mark specific parts as INACTIVE for E2E testing of workflow_status filtering
    // These parts were chosen for their cross-ref and vehicle app relationships
    const inactiveSkus = [
      "ACR512220", // MC2133-S (ATV) cross-ref target
      "ACR512136", // MC2136-S (ATV), TM512136 (TMK) target + CHRYSLER/DODGE vehicle apps
      "ACR513125", // 22 BMW vehicle apps, MW7318-S (ATV) cross-ref target
      "ACR512305", // 10 AUDI vehicle apps, TM512305 (TMK) cross-ref target
      "ACR513014", // Plain SKU for direct search exclusion test
    ];
    const inactiveResult = await client.query(
      `UPDATE parts SET workflow_status = 'INACTIVE' WHERE acr_sku = ANY($1) RETURNING acr_sku`,
      [inactiveSkus]
    );
    console.log(
      `\n🔒 Marked ${inactiveResult.rowCount} parts as INACTIVE for E2E testing`
    );

    // Get counts
    const partsResult = await client.query("SELECT COUNT(*) FROM parts");
    const vehiclesResult = await client.query(
      "SELECT COUNT(*) FROM vehicle_applications"
    );
    const crossRefsResult = await client.query(
      "SELECT COUNT(*) FROM cross_references"
    );

    console.log("\n📊 Database Summary:");
    console.log(`   Parts: ${partsResult.rows[0].count}`);
    console.log(`   Vehicle Applications: ${vehiclesResult.rows[0].count}`);
    console.log(`   Cross References: ${crossRefsResult.rows[0].count}`);
    console.log(
      `   Total Records: ${parseInt(partsResult.rows[0].count) + parseInt(vehiclesResult.rows[0].count) + parseInt(crossRefsResult.rows[0].count)}`
    );

    // Create admin user
    console.log("\n👤 Creating admin user...");
    await createAdminUser(client);

    console.log(
      '\n💡 Tip: Run "npm run db:save-snapshot" to save this as your baseline'
    );
  } catch (error: any) {
    console.error("❌ Import failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Creates the default admin user for local development.
 * This ensures a consistent login for testing purposes.
 */
async function createAdminUser(client: pg.Client) {
  const { email, password, fullName, role, isOwner } = ADMIN_USER;

  // Check if user already exists
  const existingUser = await client.query(
    "SELECT id FROM auth.users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    const existingUserId = existingUser.rows[0].id;
    console.log(`   User ${email} already exists, updating profile...`);

    // Update user_profiles to ensure correct role and owner status
    await client.query(
      `UPDATE public.user_profiles
       SET role = $1, is_owner = $2, full_name = $3, is_active = true, updated_at = now()
       WHERE email = $4`,
      [role, isOwner, fullName, email]
    );

    // Ensure identity exists (may be missing from partial runs)
    const existingIdentity = await client.query(
      "SELECT id FROM auth.identities WHERE user_id = $1 AND provider = 'email'",
      [existingUserId]
    );

    if (existingIdentity.rows.length === 0) {
      console.log(`   Creating missing identity...`);
      const identityData = JSON.stringify({
        sub: String(existingUserId),
        email: email,
        email_verified: true,
      });
      await client.query(
        `
        INSERT INTO auth.identities (
          id, user_id, provider_id, provider, identity_data,
          last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'email', $3::jsonb, now(), now(), now()
        )
      `,
        [existingUserId, email, identityData]
      );
    }

    console.log(`   ✅ Admin user updated: ${email}`);
    return;
  }

  // Create new user in auth.users
  const userId = await client.query(
    `
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      is_super_admin
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      $1,
      crypt($2, gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      $3::jsonb,
      'authenticated',
      'authenticated',
      false
    )
    RETURNING id
  `,
    [email, password, JSON.stringify({ full_name: fullName })]
  );

  const newUserId = userId.rows[0].id;

  // Create identity for the user (required for login)
  // Build the identity_data JSON in JavaScript to avoid type inference issues
  const identityData = JSON.stringify({
    sub: String(newUserId),
    email: email,
    email_verified: true,
  });

  await client.query(
    `
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      $1,
      $2,
      'email',
      $3::jsonb,
      now(),
      now(),
      now()
    )
  `,
    [newUserId, email, identityData]
  );

  // Update the user_profile (trigger creates it automatically)
  // Wait a moment for the trigger to fire
  await client.query(
    `UPDATE public.user_profiles
     SET role = $1, is_owner = $2, full_name = $3, is_active = true
     WHERE id = $4`,
    [role, isOwner, fullName, newUserId]
  );

  console.log(`   ✅ Admin user created: ${email}`);
  console.log(`   📧 Email: ${email}`);
  console.log(`   🔑 Password: ${password}`);
  console.log(`   👑 Role: ${role} (owner: ${isOwner})`);
}

// Run the import
importSeedData()
  .then(() => {
    console.log("\n✅ Import complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });
