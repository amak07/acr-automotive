/**
 * Supabase BROWSER/SRR Client Configuration
 *
 * This file configures the Supabase client for ACR Automotive.
 * This client is specifically designed to work the Next.js client-side.
 */

import { createBrowserClient } from "@supabase/ssr";

// Note: Environment variables are automatically loaded by Next.js
// For tests, next/jest loads .env.local automatically
// No manual dotenv loading needed - it creates conflicts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Supabase BROWSER/SRR Client Instance
 *
 * This client is used for all STORAGE operations:
 * - Image storage operations
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabaseBrowser = createClient();
