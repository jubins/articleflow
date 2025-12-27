# Storage Architecture Migration Guide

## Overview

We've migrated from a hybrid storage approach (Supabase storage + Database) to a database-first architecture where all text content is stored in the database, and R2 is used only for media files.

## Benefits

✅ **Simpler architecture** - No external storage for text content
✅ **Faster access** - No API calls to retrieve content
✅ **Better consistency** - Atomic updates with transactions
✅ **Cost effective** - No R2 API call costs for content
✅ **Easier to search** - Full-text search on database columns
✅ **Automatic sync** - Markdown and rich text always in sync

## What Changed

### Database Changes
- **Added column**: `articles.rich_text_content` (TEXT) - Stores rich text HTML
- **Deprecated**: `articles.markdown_url` - Kept for backward compatibility but no longer populated

### Code Changes
1. **Article generation** now saves both markdown and rich text HTML in the database
2. **Article editing** saves both formats simultaneously
3. **R2 storage** is now only used for images and media files (Mermaid diagrams, etc.)
4. **Supabase storage** dependency removed from article generation flow

### File Changes
- `supabase/migrations/002_add_rich_text_content.sql` - Database migration
- `lib/types/database.ts` - Added rich_text_content to Article type
- `app/api/generate/route.ts` - Saves rich text in database instead of external storage
- `app/articles/[id]/page.tsx` - Saves both markdown and rich text when editing
- `lib/services/r2-storage.ts` - Added markdown and text upload methods (for optional use)

## Migration Steps

### Step 1: Run Database Migration

You need to add the `rich_text_content` column to your Supabase database.

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/002_add_rich_text_content.sql`:

```sql
-- Add rich_text_content column to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS rich_text_content TEXT;

-- Add comment to document the column
COMMENT ON COLUMN articles.rich_text_content IS 'Rich text HTML content converted from markdown';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_has_rich_text ON articles((rich_text_content IS NOT NULL));

-- Deprecate markdown_url
COMMENT ON COLUMN articles.markdown_url IS 'DEPRECATED: Use content column instead. Kept for backward compatibility.';
```

4. Paste into the SQL Editor and click **Run**

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Step 2: Verify Migration

After running the migration, verify that:
1. The `rich_text_content` column exists in the `articles` table
2. The column is of type `TEXT` and allows `NULL` values
3. The index `idx_articles_has_rich_text` was created

You can verify this in the Supabase dashboard under **Table Editor** → **articles**

### Step 3: Deploy Code Changes

The code changes are already implemented. After running the database migration, simply deploy your application:

```bash
# Build the application
npm run build

# Or deploy to your hosting platform (Vercel, etc.)
```

### Step 4: Test the Migration

1. **Generate a new article** and verify both `content` and `rich_text_content` are populated
2. **Edit an article** in the Markdown tab and verify both fields are updated
3. **Edit an article** in the Rich Text tab and verify both fields are updated
4. **Check the database** to confirm rich text HTML is being stored

## Backward Compatibility

- **Existing articles** will continue to work - they'll have `NULL` for `rich_text_content`
- **First edit** will populate the rich_text_content from markdown
- **markdown_url** field is deprecated but kept for existing references

## Optional: Backfill Existing Articles

If you want to populate `rich_text_content` for existing articles, run this SQL:

```sql
-- This will convert all existing markdown content to rich text HTML
-- WARNING: This is a one-time operation. Back up your data first!

-- Note: You'll need to implement this in your application code as
-- the markdown-to-html conversion requires the markdownToHtml utility

-- Pseudo-code (run this via a script/API endpoint in your app):
-- FOR EACH article WHERE rich_text_content IS NULL:
--   article.rich_text_content = markdownToHtml(article.content)
--   UPDATE articles SET rich_text_content = ... WHERE id = ...
```

## Rollback Plan

If you need to rollback:

```sql
-- Remove the rich_text_content column
ALTER TABLE articles DROP COLUMN IF EXISTS rich_text_content;

-- Remove the index
DROP INDEX IF EXISTS idx_articles_has_rich_text;
```

Then revert the code changes by checking out the previous commit.

## Support

If you encounter any issues:
1. Check the migration was applied correctly
2. Verify environment variables are set
3. Check application logs for errors
4. Test in a development environment first

## Next Steps

After migration:
- Monitor database size (should be minimal for text content)
- Consider implementing full-text search on `content` column
- Optionally set up database backups for the new column
- Remove Supabase storage bucket if no longer needed (after verifying all data is migrated)
