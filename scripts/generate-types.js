#!/usr/bin/env node
/**
 * Generate TypeScript types from Supabase database
 * Reads project ref from environment files
 *
 * Usage:
 *   npm run types:dev    - Generate from dev database
 *   npm run types:prod   - Generate from prod database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get environment argument (dev or prod)
const env = process.argv[2] || 'dev';

// Determine which env file to use
const envFile = env === 'prod' ? '.env' : '.env.test';
const envPath = path.join(__dirname, '..', envFile);

// Check if env file exists
if (!fs.existsSync(envPath)) {
  console.error(`❌ Error: ${envFile} not found`);
  process.exit(1);
}

// Read env file
const envContent = fs.readFileSync(envPath, 'utf-8');

// Extract project ref from NEXT_PUBLIC_SUPABASE_URL
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=https:\/\/([a-z]+)\.supabase\.co/);

if (!urlMatch || !urlMatch[1]) {
  console.error(`❌ Error: Could not extract project ref from ${envFile}`);
  console.error('Expected format: NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co');
  process.exit(1);
}

const projectRef = urlMatch[1];

console.log(`\n🔧 Generating TypeScript types for ${env.toUpperCase()} environment...`);
console.log(`📦 Project ref: ${projectRef}`);
console.log(`📁 Output: src/lib/supabase/types.ts\n`);

try {
  // Run Supabase CLI command
  const command = `npx supabase gen types typescript --project-id ${projectRef}`;
  const output = execSync(command, { encoding: 'utf-8' });

  // Write to types file
  const typesPath = path.join(__dirname, '..', 'src', 'lib', 'supabase', 'types.ts');
  fs.writeFileSync(typesPath, output);

  console.log('✅ Types generated successfully!\n');
  console.log(`📝 File updated: src/lib/supabase/types.ts`);
  console.log(`🎯 Environment: ${env.toUpperCase()} (${projectRef})\n`);
} catch (error) {
  console.error('❌ Error generating types:', error.message);
  console.error('\nMake sure you have the Supabase CLI installed:');
  console.error('  npm install -g supabase');
  process.exit(1);
}
