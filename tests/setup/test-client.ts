/**
 * Test Client Singleton
 *
 * Provides a single Supabase client instance for all integration tests.
 * This eliminates "Multiple GoTrueClient instances" warnings and ensures
 * consistent connection pooling across test suites.
 *
 * Usage:
 *   import { getTestClient } from '../setup/test-client';
 *   const supabase = getTestClient();
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { verifyTestEnvironment } from './env';

// Verify test environment is loaded correctly by Next.js
verifyTestEnvironment();

// Service role key for tests (bypasses RLS)
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Singleton instance
let testClient: SupabaseClient | null = null;

/**
 * Get or create the test Supabase client
 *
 * Returns a singleton instance with service role key that bypasses RLS.
 * This prevents multiple GoTrueClient instances and improves test performance.
 *
 * @returns Supabase client with service role access
 */
export function getTestClient(): SupabaseClient {
  if (!testClient) {
    testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false, // Disable session persistence in tests
          autoRefreshToken: false, // Disable auto-refresh in tests
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'X-Client-Info': 'acr-automotive-tests',
          },
        },
      }
    );
  }
  return testClient;
}

/**
 * Reset the test client singleton
 *
 * Use this in afterAll() hooks to clean up the client instance.
 * This is typically not needed but can help with test isolation.
 */
export function resetTestClient(): void {
  testClient = null;
}
