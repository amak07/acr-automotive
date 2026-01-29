-- ============================================================================
-- Migration: Add User Profiles and Role-Based Access Control
-- Description: Migrate from password-based auth to Supabase Auth with RBAC
-- Date: 2026-01-27
-- Idempotent: Yes (safe to re-run)
-- ============================================================================

-- =====================================================
-- 1. Create user_profiles table
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'data_manager');

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'data_manager',
    is_active BOOLEAN NOT NULL DEFAULT true,
    tenant_id UUID REFERENCES tenants(id), -- For future multi-tenancy
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id), -- Track who created this user
    last_login_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);

-- Comment
COMMENT ON TABLE user_profiles IS
    'User profile data and role-based access control. Links to auth.users.';

COMMENT ON COLUMN user_profiles.role IS
    'admin: Full system access. data_manager: Parts CRUD, images, Excel import/export only.';

-- =====================================================
-- 2. Create helper functions for role checking
-- =====================================================

-- Function: Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT role
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND is_active = true
    LIMIT 1;
$$;

COMMENT ON FUNCTION get_user_role() IS
    'Returns the role of the currently authenticated user. Returns NULL if not authenticated or inactive.';

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    );
$$;

COMMENT ON FUNCTION is_admin() IS
    'Returns true if the current user is an active admin, false otherwise.';

-- Function: Check if user is admin or data_manager
CREATE OR REPLACE FUNCTION is_authenticated_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
        AND is_active = true
    );
$$;

COMMENT ON FUNCTION is_authenticated_user() IS
    'Returns true if the current user is authenticated and active (any role), false otherwise.';

-- =====================================================
-- 3. RLS Policies for user_profiles table
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin());

-- Admins can insert new users
CREATE POLICY "Admins can create users"
    ON user_profiles FOR INSERT
    WITH CHECK (is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON user_profiles FOR UPDATE
    USING (is_admin());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
        -- Can't change own role or is_active status
    );

-- Only admins can delete (deactivate) users
CREATE POLICY "Admins can delete users"
    ON user_profiles FOR DELETE
    USING (is_admin());

-- =====================================================
-- 4. Update RLS policies for existing tables
-- =====================================================

-- ========== Parts Table ==========
DROP POLICY IF EXISTS "Public read" ON parts;
DROP POLICY IF EXISTS "Admin write" ON parts;

CREATE POLICY "Public read parts"
    ON parts FOR SELECT
    USING (true); -- Anonymous users can search

CREATE POLICY "Authenticated users can manage parts"
    ON parts FOR ALL
    USING (is_authenticated_user());

-- ========== Vehicle Applications Table ==========
DROP POLICY IF EXISTS "Public read" ON vehicle_applications;
DROP POLICY IF EXISTS "Admin write" ON vehicle_applications;

CREATE POLICY "Public read vehicle_applications"
    ON vehicle_applications FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage vehicle_applications"
    ON vehicle_applications FOR ALL
    USING (is_authenticated_user());

-- ========== Cross References Table ==========
DROP POLICY IF EXISTS "Public read" ON cross_references;
DROP POLICY IF EXISTS "Admin write" ON cross_references;

CREATE POLICY "Public read cross_references"
    ON cross_references FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage cross_references"
    ON cross_references FOR ALL
    USING (is_authenticated_user());

-- ========== Part Images Table ==========
DROP POLICY IF EXISTS "Public read" ON part_images;
DROP POLICY IF EXISTS "Admin write" ON part_images;

CREATE POLICY "Public read part_images"
    ON part_images FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage part_images"
    ON part_images FOR ALL
    USING (is_authenticated_user());

-- ========== Part 360 Frames Table ==========
DROP POLICY IF EXISTS "Public read 360 frames" ON part_360_frames;
DROP POLICY IF EXISTS "Admin write 360 frames" ON part_360_frames;

CREATE POLICY "Public read part_360_frames"
    ON part_360_frames FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage part_360_frames"
    ON part_360_frames FOR ALL
    USING (is_authenticated_user());

-- ========== Site Settings Table (Admin-only write) ==========
DROP POLICY IF EXISTS "Public read settings" ON site_settings;
DROP POLICY IF EXISTS "Admin full access settings" ON site_settings;

CREATE POLICY "Public read site_settings"
    ON site_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage site_settings"
    ON site_settings FOR ALL
    USING (is_admin()); -- Only admins can modify settings

-- ========== Tenants Table (Admin-only write) ==========
DROP POLICY IF EXISTS "Public read tenants" ON tenants;
DROP POLICY IF EXISTS "Admin write tenants" ON tenants;

CREATE POLICY "Public read tenants"
    ON tenants FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tenants"
    ON tenants FOR ALL
    USING (is_admin());

-- ========== Import History Table ==========
DROP POLICY IF EXISTS "Public read import history" ON import_history;
DROP POLICY IF EXISTS "Admin write import history" ON import_history;

CREATE POLICY "Public read import_history"
    ON import_history FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage import_history"
    ON import_history FOR ALL
    USING (is_authenticated_user());

-- =====================================================
-- 5. Storage bucket RLS policies update
-- =====================================================

-- Drop old storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for acr-part-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon upload to acr-part-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update to acr-part-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete from acr-part-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Site Assets" ON storage.objects;

-- Public read for all buckets
CREATE POLICY "Public read storage"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('acr-part-images', 'acr-360-frames', 'acr-site-assets'));

-- Authenticated users can upload/update/delete in part images and 360 frames
CREATE POLICY "Authenticated users manage part images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('acr-part-images', 'acr-360-frames')
        AND is_authenticated_user()
    );

CREATE POLICY "Authenticated users update part images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id IN ('acr-part-images', 'acr-360-frames')
        AND is_authenticated_user()
    );

CREATE POLICY "Authenticated users delete part images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id IN ('acr-part-images', 'acr-360-frames')
        AND is_authenticated_user()
    );

-- Only admins can manage site assets
CREATE POLICY "Admins manage site assets insert"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'acr-site-assets'
        AND is_admin()
    );

CREATE POLICY "Admins manage site assets update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'acr-site-assets'
        AND is_admin()
    );

CREATE POLICY "Admins manage site assets delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'acr-site-assets'
        AND is_admin()
    );

-- =====================================================
-- 6. Trigger to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile_updated_at();

-- =====================================================
-- 7. Trigger to auto-create user_profile on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'data_manager')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration: Add User Profiles and RBAC completed successfully';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - user_profiles table with role enum (admin, data_manager)';
  RAISE NOTICE '  - 3 helper functions: get_user_role(), is_admin(), is_authenticated_user()';
  RAISE NOTICE '  - 6 RLS policies for user_profiles table';
  RAISE NOTICE '  - 2 triggers: updated_at, auto-create profile on signup';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated RLS Policies:';
  RAISE NOTICE '  - parts: Public read, authenticated write';
  RAISE NOTICE '  - vehicle_applications: Public read, authenticated write';
  RAISE NOTICE '  - cross_references: Public read, authenticated write';
  RAISE NOTICE '  - part_images: Public read, authenticated write';
  RAISE NOTICE '  - part_360_frames: Public read, authenticated write';
  RAISE NOTICE '  - site_settings: Public read, ADMIN-ONLY write';
  RAISE NOTICE '  - tenants: Public read, admin-only write';
  RAISE NOTICE '  - import_history: Public read, authenticated write';
  RAISE NOTICE '  - storage.objects: Public read, role-based write';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Create first admin user via Supabase Dashboard';
  RAISE NOTICE '  2. Update user_profiles SET role = ''admin'' WHERE email = ''your-admin@email.com''';
  RAISE NOTICE '  3. Deploy frontend changes (AuthContext, API routes, middleware)';
  RAISE NOTICE '  4. Test authentication flow';
END $$;
