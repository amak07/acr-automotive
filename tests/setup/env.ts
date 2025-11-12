/**
 * Test Environment Configuration
 *
 * This module provides a standardized way to load environment variables for tests.
 * It ensures all tests use the local Supabase instance running in Docker.
 *
 * Usage:
 *   import { loadTestEnvironment } from '@/tests/setup/env';
 *
 *   loadTestEnvironment(); // Call at the top of your test file
 */

import dotenv from 'dotenv';
import path from 'path';

/**
 * Verify test environment variables are loaded correctly
 *
 * Next.js automatically loads .env files via next/jest in this order:
 *   1. .env
 *   2. .env.test
 *   3. .env.test.local (highest priority - overrides previous)
 *
 * This function VERIFIES the environment is configured correctly.
 * It does NOT load environment variables (Next.js does that automatically).
 *
 * Expected environment:
 * - NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Local Supabase demo key
 * - DATABASE_URL: postgresql://postgres:postgres@localhost:54322/postgres
 */
export function verifyTestEnvironment(): void {
  // Verify critical environment variables are loaded
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL not found. ' +
      'Ensure .env.test.local exists and contains local Supabase credentials.'
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY not found. ' +
      'Ensure .env.test.local exists and contains local Supabase credentials.'
    );
  }

  // Verify we're connecting to local Supabase (safety check)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl.includes('localhost') && !supabaseUrl.includes('127.0.0.1')) {
    throw new Error(
      '❌ CRITICAL: Tests are connecting to REMOTE database!\n' +
      `   Current URL: ${supabaseUrl}\n` +
      '   Expected: http://localhost:54321\n\n' +
      '   Check that .env.test.local exists and contains:\n' +
      '   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321\n\n' +
      '   This safety check prevents accidental modification of remote databases.'
    );
  }

  console.log('✅ Test environment verified: connecting to', supabaseUrl);
}

/**
 * Get current test environment info
 *
 * Useful for debugging environment configuration issues.
 */
export function getTestEnvironmentInfo(): {
  supabaseUrl: string;
  hasAnonKey: boolean;
  hasDatabaseUrl: boolean;
  isLocalhost: boolean;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  return {
    supabaseUrl,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    isLocalhost: supabaseUrl.includes('localhost'),
  };
}
