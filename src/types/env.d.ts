/**
 * TypeScript Environment Variable Type Definitions
 *
 * Extends NodeJS.ProcessEnv to include all valid NODE_ENV values
 * used across dev/test/staging/production environments.
 *
 * This file uses module augmentation to properly extend the NodeJS namespace.
 */

export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test' | 'staging';
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
    }
  }
}