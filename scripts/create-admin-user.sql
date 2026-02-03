-- Create admin user for local development
-- This script creates an admin user and sets their role
-- NOTE: For production, always create users through Supabase Auth API

-- Insert into auth.users with all required fields for GoTrue compatibility
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  is_super_admin
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@acr.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  '',  -- confirmation_token (empty string, not NULL)
  '',  -- recovery_token
  '',  -- email_change_token_new
  '',  -- email_change
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "System Administrator"}',
  'authenticated',
  'authenticated',
  false
);

-- Update the user_profile to admin role (trigger creates the profile automatically)
UPDATE public.user_profiles
SET role = 'admin', full_name = 'System Administrator'
WHERE email = 'admin@acr.com';

-- Verify the user was created
SELECT id, email, role, is_active, full_name FROM public.user_profiles WHERE email = 'admin@acr.com';
