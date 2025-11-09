/**
 * Supabase Client Configuration
 *
 * This file configures the Supabase client for ACR Automotive.
 * Supabase provides database, authentication, and storage services.
 */

import { createClient } from "@supabase/supabase-js";

// Note: In production (Vercel), environment variables are automatically loaded
// Only load dotenv for local development and testing
if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  const dotenv = require("dotenv");

  if (process.env.NODE_ENV === "test") {
    // CRITICAL: Use override:true to ensure .env.test takes precedence over .env
    dotenv.config({ path: ".env.test", override: true });
  } else {
    dotenv.config();
  }
}

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
    schema: 'public',
  },
  // Disable schema validation in test/development to avoid schema cache issues
  // In production, Vercel deployments will use the latest schema
  global: {
    headers: {
      'X-Client-Info': 'acr-automotive'
    }
  }
});
