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
import { createClient } from "@supabase/supabase-js";

const { Client } = pg;

// Supabase client for Storage uploads (local dev only — standard demo service_role key)
// Uses service_role to bypass RLS (anon can't upload after RBAC migration)
const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const supabaseClient = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY);

// Default users for local development and testing
const SEED_USERS = [
  {
    email: "abel.mak@acr.com",
    password: "acr2026admin",
    fullName: "Abel Mak",
    role: "admin",
    isOwner: true,
  },
  {
    email: "carlos.data@acr.com",
    password: "acr2026data",
    fullName: "Carlos Data",
    role: "data_manager",
    isOwner: false,
  },
];

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

    // Seed part_images from local product photos (if available)
    await seedPartImages(client);

    // Seed site_settings (banners + contact info)
    await seedSiteSettings(client);

    // Get counts
    const partsResult = await client.query("SELECT COUNT(*) FROM parts");
    const vehiclesResult = await client.query(
      "SELECT COUNT(*) FROM vehicle_applications"
    );
    const crossRefsResult = await client.query(
      "SELECT COUNT(*) FROM cross_references"
    );
    const imagesResult = await client.query(
      "SELECT COUNT(*) FROM part_images"
    );

    console.log("\n📊 Database Summary:");
    console.log(`   Parts: ${partsResult.rows[0].count}`);
    console.log(`   Vehicle Applications: ${vehiclesResult.rows[0].count}`);
    console.log(`   Cross References: ${crossRefsResult.rows[0].count}`);
    console.log(`   Part Images: ${imagesResult.rows[0].count}`);
    console.log(
      `   Total Records: ${parseInt(partsResult.rows[0].count) + parseInt(vehiclesResult.rows[0].count) + parseInt(crossRefsResult.rows[0].count) + parseInt(imagesResult.rows[0].count)}`
    );

    // Create seed users (admin + data_manager)
    console.log("\n👤 Creating seed users...");
    for (const user of SEED_USERS) {
      await createUser(client, user);
    }

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

/** Filename suffix → view_type mapping for product photos */
const VIEW_TYPE_MAP: Record<string, { viewType: string; displayOrder: number; isPrimary: boolean }> = {
  _fro: { viewType: "front", displayOrder: 0, isPrimary: true },
  _bot: { viewType: "back", displayOrder: 1, isPrimary: false },
  _top: { viewType: "top", displayOrder: 2, isPrimary: false },
  _oth: { viewType: "other", displayOrder: 3, isPrimary: false },
};

/**
 * Seed part_images from local product photos in public/product-images/IMAGENES-360-optimized/.
 * Each SKU has 4 views: _fro (front), _bot (back), _top (top), _oth (other).
 * Uploads images to Supabase Storage and stores absolute URLs in the DB.
 * Skips gracefully if the directory doesn't exist (e.g., in CI).
 */
async function seedPartImages(client: pg.Client) {
  const imageDir = path.join(
    process.cwd(),
    "public",
    "product-images",
    "IMAGENES-360-optimized"
  );

  try {
    await fs.access(imageDir);
  } catch {
    console.log("\n📷 Skipping part_images seed (image directory not found)");
    return;
  }

  console.log("\n📷 Seeding part_images via Supabase Storage...");

  const files = await fs.readdir(imageDir);

  // Parse filenames: ACR512001_fro.jpg → { sku: "ACR512001", suffix: "_fro" }
  const imageEntries: { sku: string; suffix: string; filename: string }[] = [];
  for (const file of files) {
    const match = file.match(/^(ACR[A-Z0-9]+)(_fro|_bot|_top|_oth)\.jpg$/i);
    if (match) {
      imageEntries.push({ sku: match[1], suffix: match[2].toLowerCase(), filename: file });
    }
  }

  // Upload to Storage and insert DB records in batches of 5
  const BATCH_SIZE = 5;
  let inserted = 0;
  let uploadErrors = 0;

  for (let i = 0; i < imageEntries.length; i += BATCH_SIZE) {
    const batch = imageEntries.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (entry) => {
        const mapping = VIEW_TYPE_MAP[entry.suffix];
        if (!mapping) return;

        // Deterministic storage path for idempotent re-runs
        const storagePath = `product-images/${entry.sku}${entry.suffix}.jpg`;
        const filePath = path.join(imageDir, entry.filename);
        const fileBuffer = await fs.readFile(filePath);

        // Upload to Supabase Storage (upsert for idempotency)
        const { error: uploadError } = await supabaseClient.storage
          .from("acr-part-images")
          .upload(storagePath, fileBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          if (uploadErrors === 0) console.warn(`\n   ⚠ Storage upload error: ${uploadError.message}`);
          uploadErrors++;
          return;
        }

        // Get absolute public URL
        const { data: urlData } = supabaseClient.storage
          .from("acr-part-images")
          .getPublicUrl(storagePath);

        // Insert DB record with absolute URL
        const result = await client.query(
          `INSERT INTO part_images (part_id, image_url, view_type, display_order, is_primary, caption)
           SELECT p.id, $1, $2, $3, $4, NULL
           FROM parts p WHERE p.acr_sku = $5
           ON CONFLICT (part_id, view_type) DO UPDATE SET image_url = EXCLUDED.image_url`,
          [urlData.publicUrl, mapping.viewType, mapping.displayOrder, mapping.isPrimary, entry.sku]
        );

        if (result.rowCount && result.rowCount > 0) inserted++;
      })
    );

    // Progress indicator
    const pct = Math.round(((i + batch.length) / imageEntries.length) * 100);
    process.stdout.write(`\r   Uploading... ${pct}% (${i + batch.length}/${imageEntries.length})`);
  }

  console.log(
    `\n   ✅ Seeded ${inserted} part_images from ${new Set(imageEntries.map((e) => e.sku)).size} SKUs` +
      (uploadErrors > 0 ? ` (${uploadErrors} upload errors)` : "")
  );
}

/** Banner pairings: desktop image → mobile image */
const BANNER_PAIRS = [
  {
    desktop: "acr_banner_v4.png",
    mobile: "acr_banner_white_mobile2.png",
    title: "ACR Automotive",
  },
  {
    desktop: "acr_banner_dark_desktop.png",
    mobile: "acr_banner_dark_mobile.png",
    title: "ACR Automotive",
  },
  {
    desktop: "acr_banner_mazas.png",
    mobile: "acr_banner_bearing_mobile.png",
    title: "ACR Automotive",
  },
];

/**
 * Seed site_settings with banner images and contact info.
 * Uploads banners from public/banners/ to Supabase Storage and updates
 * the branding and contact_info settings in the database.
 */
async function seedSiteSettings(client: pg.Client) {
  // --- Upload banners ---
  const bannerDir = path.join(process.cwd(), "public", "banners");

  const banners: Array<{
    id: string;
    image_url: string;
    mobile_image_url?: string;
    title?: string;
    display_order: number;
    is_active: boolean;
  }> = [];

  let hasBannerDir = true;
  try {
    await fs.access(bannerDir);
  } catch {
    hasBannerDir = false;
    console.log("\n🖼️  Skipping banner upload (public/banners/ not found)");
  }

  if (hasBannerDir) {
    console.log("\n🖼️  Seeding banner images via Supabase Storage...");

    for (let i = 0; i < BANNER_PAIRS.length; i++) {
      const pair = BANNER_PAIRS[i];

      // Upload desktop image
      const desktopPath = path.join(bannerDir, pair.desktop);
      const desktopBuffer = await fs.readFile(desktopPath);
      const desktopStoragePath = `banners/${pair.desktop}`;

      const { error: desktopErr } = await supabaseClient.storage
        .from("acr-site-assets")
        .upload(desktopStoragePath, desktopBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (desktopErr) {
        console.warn(`   ⚠ Failed to upload ${pair.desktop}: ${desktopErr.message}`);
        continue;
      }

      const { data: desktopUrl } = supabaseClient.storage
        .from("acr-site-assets")
        .getPublicUrl(desktopStoragePath);

      // Upload mobile image
      const mobilePath = path.join(bannerDir, pair.mobile);
      const mobileBuffer = await fs.readFile(mobilePath);
      const mobileStoragePath = `banners/${pair.mobile}`;

      const { error: mobileErr } = await supabaseClient.storage
        .from("acr-site-assets")
        .upload(mobileStoragePath, mobileBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (mobileErr) {
        console.warn(`   ⚠ Failed to upload ${pair.mobile}: ${mobileErr.message}`);
      }

      const { data: mobileUrl } = supabaseClient.storage
        .from("acr-site-assets")
        .getPublicUrl(mobileStoragePath);

      banners.push({
        id: crypto.randomUUID(),
        image_url: desktopUrl.publicUrl,
        mobile_image_url: mobileErr ? undefined : mobileUrl.publicUrl,
        title: pair.title,
        display_order: i,
        is_active: true,
      });
    }

    console.log(`   ✅ Uploaded ${banners.length} banner pairs`);
  }

  // --- Update branding setting ---
  const branding = {
    company_name: "ACR Automotive",
    logo_url: "",
    favicon_url: "",
    banners,
  };

  await client.query(
    `UPDATE site_settings SET value = $1::jsonb, updated_at = NOW() WHERE key = 'branding'`,
    [JSON.stringify(branding)]
  );
  console.log("   ✅ Branding setting updated");

  // --- Update contact_info setting ---
  const contactInfo = {
    email: "contacto@acrautomotive.com",
    phone: "+52 81 1234 5678",
    whatsapp: "+52 81 9876 5432",
    address: "Av. Industrial 450, Parque Industrial, Monterrey, N.L. 64000, México",
  };

  await client.query(
    `UPDATE site_settings SET value = $1::jsonb, updated_at = NOW() WHERE key = 'contact_info'`,
    [JSON.stringify(contactInfo)]
  );
  console.log("   ✅ Contact info setting updated");
}

/**
 * Creates a user for local development/testing.
 * Handles both new creation and updates to existing users.
 */
async function createUser(
  client: pg.Client,
  user: { email: string; password: string; fullName: string; role: string; isOwner: boolean }
) {
  const { email, password, fullName, role, isOwner } = user;

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

    console.log(`   ✅ User updated: ${email} (${role})`);
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

  console.log(`   ✅ User created: ${email} (${role}${isOwner ? ", owner" : ""})`);
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
