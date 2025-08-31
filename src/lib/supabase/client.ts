/**
 * Supabase Client Configuration
 *
 * This file configures the Supabase client for ACR Automotive.
 * Supabase provides database, authentication, and storage services.
 */

import { createClient } from "@supabase/supabase-js";

import dotenv from "dotenv";
dotenv.config();

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
 * - Image storage operations
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
