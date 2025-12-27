# Database Migration Instructions

This document explains how to apply pending database migrations to your ArticleFlow application.

## 🚨 URGENT: Fix Carousel Generation Error

**If you're seeing: "Could not find the 'file_id' column"**, run this SQL immediately:

### Quick Fix (Do This First!)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `QUICK_FIX.sql` (or the SQL below):

```sql
-- Add missing columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS file_id TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS rich_text_content TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS article_type TEXT DEFAULT 'technical';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_articles_file_id ON articles(file_id);
CREATE INDEX IF NOT EXISTS idx_articles_has_rich_text ON articles((rich_text_content IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_articles_article_type ON articles(article_type);
```

3. Click **Run**
4. **Test carousel generation again** - it should work now!

---

## Other Pending Migrations

### 1. Drop markdown_url Column (005_drop_markdown_url.sql)

**Purpose:** Remove the deprecated `markdown_url` column from the `articles` table since content is now stored directly in the database.

**Why:**
- Content is stored in `content` column (markdown text)
- Rich text HTML is stored in `rich_text_content` column
- Only media files need R2 storage, not text content
- This reduces database bloat and simplifies the schema

**How to Apply:**

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/005_drop_markdown_url.sql`:
   ```sql
   -- Drop markdown_url column from articles table
   ALTER TABLE articles DROP COLUMN IF EXISTS markdown_url;

   -- Update documentation
   COMMENT ON TABLE articles IS 'Generated articles with content stored directly in database. Media files are stored on R2.';
   ```
4. Click **Run** to execute the migration

#### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or manually apply the migration
supabase db execute --file supabase/migrations/005_drop_markdown_url.sql
```

## Fixing Missing Profiles (If Needed)

If you encounter errors about missing profiles when generating articles, you may need to run the `fix-missing-profile.sql` migration:

### Using Supabase Dashboard:
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `supabase/migrations/fix-missing-profile.sql`
3. Click **Run**

This will:
- Create profiles for any auth users that don't have one
- Create user_settings for any profiles that don't have settings
- Display a verification table showing which users have profiles and settings

**Note:** The application now automatically creates missing profiles when generating articles, so this migration should only be needed for existing users.

## Migration Order

If applying multiple migrations, follow this order:

1. `001_complete_schema.sql` - Base schema (already applied)
2. `002_add_rich_text_content.sql` - Add rich text column
3. `002_fix_profiles_rls.sql` - Fix profile RLS policies
4. `003_add_profiles_insert_policy.sql` - Add profile insert policy
5. `004_add_article_type.sql` - Add article type column
6. `fix-missing-profile.sql` - Fix any missing profiles (if needed)
7. `005_drop_markdown_url.sql` - Drop deprecated markdown_url column

## Verifying Migrations

After applying migrations, verify they worked:

### Check if markdown_url column is dropped:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'articles'
AND column_name = 'markdown_url';
```

Should return no results if successfully dropped.

### Check profiles and settings exist:
```sql
SELECT
    au.email,
    CASE WHEN p.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_profile,
    CASE WHEN us.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_settings
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_settings us ON us.user_id = au.id;
```

All users should have both profile and settings.

## Rollback (If Needed)

If you need to rollback the markdown_url column removal:

```sql
-- Re-add the column (though this is not recommended)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS markdown_url TEXT;
COMMENT ON COLUMN articles.markdown_url IS 'DEPRECATED: Use content column instead. Kept for backward compatibility.';
```

## Support

If you encounter any issues applying migrations:
1. Check the error message in the Supabase SQL Editor
2. Ensure you have the correct permissions
3. Verify the table exists and is accessible
4. Contact support if issues persist
