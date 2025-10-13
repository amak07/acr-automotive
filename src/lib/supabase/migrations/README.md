# Database Migrations

This directory contains database migrations for ACR Automotive.

## How to Apply Migrations

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your project
2. Click **SQL Editor** in the left sidebar
3. Open the migration file (e.g., `001_add_part_images.sql`)
4. Copy and paste the SQL into the editor
5. Click **Run**
6. Update the status below to `[x]` when applied

## Migration History

| # | File | Description | Status | Applied Date |
|---|------|-------------|--------|--------------|
| - | `schema.sql` | Initial database schema | ✅ Applied | ~Sept 7, 2025 |
| 001 | `001_add_part_images.sql` | Multiple images per part (Feature 2.3) | ✅ Applied | Oct 11, 2025 |

## Upcoming Migrations

- **002_add_site_settings.sql** - Site settings and banners (Feature 2.4)

## Notes

- Always backup your database before applying migrations
- Migrations are applied manually via Supabase SQL Editor
- Keep this README updated when applying migrations
- Migration files are version controlled for documentation purposes