/**
 * Supabase Client Configuration
 *
 * This file configures the Supabase client for ACR Automotive.
 * Supabase provides database, authentication, and storage services.
 */

import { createClient } from "@supabase/supabase-js";

// Note: Environment variables are automatically loaded by Next.js
// For tests, next/jest loads .env.local automatically
// No manual dotenv loading needed - it creates conflicts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Supabase Client Instance
 *
 * This client is used for all database operations:
 * - Parts catalog management
 * - Vehicle applications
 * - Cross-reference lookups
 *
 * Note: Schema validation is disabled for test environments to allow
 * dynamic schema changes (migrations) during test runs.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: "public",
  },
  // Disable schema validation in test/development to avoid schema cache issues
  // In production, Vercel deployments will use the latest schema
  global: {
    headers: {
      "X-Client-Info": "acr-automotive",
    },
  },
});

/**
 * Service role client for admin operations that need to bypass RLS.
 * Only use in server-side API routes that are already gated by requireAuth().
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
