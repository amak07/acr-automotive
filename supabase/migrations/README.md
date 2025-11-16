# Supabase Migrations - Pull-Based Workflow

## Overview

This project uses a **PULL-BASED** schema workflow where the **remote TEST database is the source of truth**.

## Current Migration

- `20251109204841_remote_schema.sql` - Complete schema snapshot (Nov 9, 2025)
  - 53KB - Contains ALL tables, functions, indexes, RLS policies
  - This is the ONLY active migration
  - Includes: parts, vehicle_applications, cross_references, part_images, part_360_frames, site_settings, tenants, import_history

## How to Create New Migrations

### Step 1: Apply Changes to Remote TEST First

1. Go to Supabase Dashboard → SQL Editor
2. Write and test your schema change
3. Verify it works in remote TEST environment
4. **Test thoroughly** before proceeding

**Why remote first?**

- Catches Supabase-specific features/limitations early
- Ensures team alignment on schema
- Validates RLS policies in cloud environment

### Step 2: Pull Schema Diff

```bash
npx supabase db diff --linked -f descriptive_name
```

**Examples**:

```bash
npx supabase db diff --linked -f add_inventory_tracking
npx supabase db diff --linked -f update_parts_search_function
npx supabase db diff --linked -f add_user_roles_table
```

This creates: `supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`

### Step 3: Review Generated Migration

```bash
# Review the generated SQL
cat supabase/migrations/20251114*_descriptive_name.sql

# Test locally
npm run supabase:reset          # Applies all migrations
npm run db:import-seed          # Restore data
npm run dev                      # Test the change
```

### Step 4: Commit to Git

```bash
git add supabase/migrations/*.sql
git commit -m "feat: add inventory tracking to parts table"
git push
```

### Step 5: Team Applies Migration

When team members pull your changes:

```bash
git pull
npm run supabase:reset          # Applies all migrations (including new one)
npm run db:restore-snapshot     # Restores their local data
```

## Why Pull-Based Workflow?

### Traditional (Push-Based) Workflow

```
Developer writes migration file locally
  ↓
Applies to local database
  ↓
Commits migration
  ↓
Applies to staging/production
```

**Problems**:

- Manual SQL writing (error-prone)
- Might work locally but fail in cloud
- Schema drift between environments
- RLS policies hard to test locally

### Our Workflow (Pull-Based)

```
Apply change to remote TEST first
  ↓
Test in real Supabase environment
  ↓
Pull schema diff (auto-generates migration)
  ↓
Review and commit
  ↓
Team applies same migration
```

**Benefits**:

- ✅ Remote TEST is single source of truth
- ✅ Automatic migration generation (less error-prone)
- ✅ Tests in cloud environment first
- ✅ Team always in sync with same schema
- ✅ RLS policies tested in real environment

## Common Operations

### Check for Schema Drift

See if your local schema differs from remote TEST:

```bash
npx supabase db diff --linked
```

If output is empty: ✅ Schemas match
If output has SQL: ⚠️ Remote has changes you don't have locally

### Pull Latest Schema

```bash
npx supabase db diff --linked -f sync_schema
npm run supabase:reset
npm run db:restore-snapshot
```

### Rollback Last Migration

```bash
# Remove the migration file
rm supabase/migrations/YYYYMMDDHHMMSS_bad_migration.sql

# Reset database (excludes deleted migration)
npm run supabase:reset
npm run db:restore-snapshot
```

**For production rollback**: Requires careful planning and testing!

## Important Limitations

### Storage Buckets and Migrations

⚠️ **Important**: `npx supabase db diff` only captures **DATABASE schema** (PostgreSQL), not Storage service configuration.

**However, storage buckets CAN be created via SQL migrations** (which is what we do):

#### Our Approach: SQL Migration for Storage Buckets

We create storage buckets directly in migrations using SQL:

```sql
-- See: supabase/migrations/20251115182620_create_storage_bucket.sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'acr-part-images',
  'acr-part-images',
  true,
  10485760,  -- 10MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
```

**Why this works**:

- ✅ Version controlled (in git)
- ✅ Automatic (applies on `npm run supabase:reset`)
- ✅ Team-friendly (everyone gets bucket automatically)
- ✅ Works with stable CLI (no beta/experimental needed)

#### Alternative: config.toml (Beta Feature)

Storage bucket configuration in `supabase/config.toml` is a **beta/experimental feature**:

```toml
[storage.buckets.acr-part-images]  # Requires --experimental flag or @beta CLI
public = true
file_size_limit = "10MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
```

**Why we don't use it**:

- Requires `npx supabase start --experimental` or `npx supabase@beta`
- Feature is still in beta (as of November 2024)
- Not available in stable CLI v2.58.5

**Our config.toml** keeps this configuration as documentation, but buckets are **actually created via SQL migration**.

**Verifying buckets exist**:

```bash
npm run supabase:reset  # Applies migration that creates bucket
# Open http://localhost:54323 (Supabase Studio)
# Navigate to Storage → Should see "acr-part-images" bucket
```

## Troubleshooting

### "Bucket not found" error

**Problem**: Upload fails with "Bucket not found" error

**Most likely cause**: Migration hasn't been applied yet

**Solution**:

```bash
# Reset database to apply all migrations (including bucket creation)
npm run supabase:reset

# Restore your data
npm run db:restore-snapshot
# OR
npm run db:import-seed

# Verify bucket exists in Studio
# Open http://localhost:54323 → Storage → Should see "acr-part-images"
```

**If bucket still missing**: Check that migration file exists:

```bash
ls supabase/migrations/*_create_storage_bucket.sql
# Should show: supabase/migrations/20251115182620_create_storage_bucket.sql
```

### "Migration failed to apply"

```bash
# Check migration SQL syntax
cat supabase/migrations/YYYYMMDDHHMMSS_*.sql

# Try fresh reset
npm run supabase:stop
rm -rf .supabase
npm run supabase:start
```

### "Schema drift detected"

Someone made changes to remote TEST without generating a migration:

```bash
# Pull the changes
npx supabase db diff --linked -f catch_up_schema

# Review and commit
git add supabase/migrations/*.sql
git commit -m "chore: sync schema from remote TEST"
```

### "Local schema out of sync with team"

```bash
git pull                        # Get latest migrations
npm run supabase:reset         # Apply all migrations
npm run db:restore-snapshot    # Restore your data
```

## Migration History

| Migration                          | Date        | Description                             |
| ---------------------------------- | ----------- | --------------------------------------- |
| `20251109204841_remote_schema.sql` | Nov 9, 2025 | Complete schema snapshot - all 8 tables |

Future migrations will be added here as they're created.

## Related Documentation

- **Complete database reference**: `docs/database/DATABASE.md`
- **Workflow guide**: `SCRIPTS.md` → "Schema Change Workflow"
- **Architecture**: `docs/PLANNING.md`
- **Historical schemas**: `archive/migrations/` (for learning/RAG)

## Quick Command Reference

| Task                   | Command                                            |
| ---------------------- | -------------------------------------------------- |
| Check for drift        | `npx supabase db diff --linked`                    |
| Pull schema changes    | `npx supabase db diff --linked -f description`     |
| Apply migrations       | `npm run supabase:reset`                           |
| Test migration locally | `npm run supabase:reset && npm run db:import-seed` |
| View Supabase Studio   | Open `http://localhost:54323`                      |

---

**Remember**: Remote TEST is the source of truth. Always apply changes there first, then pull the diff!
