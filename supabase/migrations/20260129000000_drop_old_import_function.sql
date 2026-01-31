-- =====================================================
-- Migration 014a: Drop old import function signature
-- =====================================================
-- See Supabase CLI bug #4746 for why this is separate
-- =====================================================

DROP FUNCTION IF EXISTS execute_atomic_import(
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, uuid
);
