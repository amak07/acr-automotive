-- ============================================================================
-- Migration: Add is_owner flag to user_profiles
-- Description: Protect owner accounts from being deactivated or modified
-- Date: 2026-01-28
-- ============================================================================

-- Add is_owner column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT false;

-- Comment
COMMENT ON COLUMN user_profiles.is_owner IS
    'Owner flag - owners cannot be deactivated or have their role changed by other admins.';

-- Create index for quick owner lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_owner ON user_profiles(is_owner) WHERE is_owner = true;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration complete: is_owner flag added to user_profiles';
  RAISE NOTICE '';
  RAISE NOTICE 'To set an owner, run:';
  RAISE NOTICE '  UPDATE user_profiles SET is_owner = true WHERE email = ''your-email@example.com'';';
  RAISE NOTICE '';
END $$;
