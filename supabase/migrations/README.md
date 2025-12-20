# Database Migrations

This directory contains all database migrations for ContentForge.

## Migration Files

### Current Migrations

- **001_complete_schema.sql** - Initial complete database schema
  - All tables, indexes, triggers, and RLS policies
  - Auto-creates profiles and user_settings for new users

### Helper Scripts (Root Directory)

- **fix-missing-profile.sql** - One-time fix for existing users
  - Run this ONCE after initial setup to fix users who signed up before the trigger was created
  - Creates missing profiles and user_settings for existing auth users

## How to Run Migrations

### Initial Setup (First Time)

1. **Run the main migration:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste `001_complete_schema.sql`
   - Execute

2. **Fix existing users (if any):**
   - Copy and paste `../fix-missing-profile.sql` from root directory
   - Execute
   - Verify all users have profiles and settings

### Future Migrations

When you need to make database changes:

1. **Create a new migration file:**
   ```bash
   # Copy the template
   cp 002_example_future_migration.sql 00X_your_change_name.sql
   ```

2. **Edit the new file:**
   - Add your table alterations
   - Add new tables
   - Add new policies
   - Document what it does

3. **Run in Supabase:**
   - Copy and paste into SQL Editor
   - Execute
   - Verify changes

4. **Commit to git:**
   ```bash
   git add supabase/migrations/00X_your_change_name.sql
   git commit -m "feat: Add database migration for X"
   ```

## Migration Naming Convention

- Format: `XXX_descriptive_name.sql`
- Examples:
  - `002_add_article_categories.sql`
  - `003_add_user_preferences.sql`
  - `004_add_workflow_scheduling.sql`

## Important Notes

- ✅ Always use `IF NOT EXISTS` for tables and columns
- ✅ Always use `CREATE OR REPLACE` for functions
- ✅ Test migrations in a development environment first
- ✅ Include rollback instructions in comments
- ❌ Never modify existing migration files after they're deployed
- ❌ Never delete migration files

## Rollback Strategy

If you need to undo a migration:

1. Create a new migration with the reverse changes
2. Example: If `003_add_column.sql` added a column, create `004_remove_column.sql`
3. Never edit the original migration file

## Troubleshooting

### Foreign Key Errors

If you see "Key is not present in table" errors:
- Run `fix-missing-profile.sql` from root directory
- This fixes users created before the auto-trigger was in place

### Table Already Exists

Use `CREATE TABLE IF NOT EXISTS` to avoid errors on re-runs.

### Policy Conflicts

Drop existing policies before recreating:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...
```
