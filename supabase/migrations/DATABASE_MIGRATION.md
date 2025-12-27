# Database Migration - Add diagram_images Field

## Overview
This migration adds a new field `diagram_images` to the `articles` table to cache diagram URLs and avoid redundant uploads to R2.

## SQL Migration

Run this SQL command in your Supabase SQL editor:

```sql
-- Add diagram_images column to articles table
ALTER TABLE articles
ADD COLUMN diagram_images JSONB DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN articles.diagram_images IS 'Cached URLs of mermaid diagrams uploaded to R2. Format: {"diagram-0": "https://...", "diagram-1": "https://..."}';

-- Optional: Add index for faster queries if needed
CREATE INDEX IF NOT EXISTS idx_articles_diagram_images
ON articles USING GIN (diagram_images);
```

## How It Works

1. **First Download**: When a user downloads an article with mermaid diagrams:
   - Diagrams are converted to images
   - Images are uploaded to R2 (or use mermaid.ink URLs)
   - URLs are stored in `diagram_images` field as JSON

2. **Subsequent Downloads**:
   - System checks if diagram URLs are already cached
   - Uses cached URLs instead of re-uploading
   - Only uploads new diagrams if content changed

## Benefits

- **Reduced R2 API Calls**: Diagrams are only uploaded once
- **Faster Downloads**: No need to regenerate/upload existing diagrams
- **Cost Savings**: Fewer R2 operations means lower costs
- **Better Performance**: Cached diagrams load instantly

## Example Data Structure

```json
{
  "diagram-0": "https://your-r2-bucket.com/articles/abc123/diagrams/diagram-0.png",
  "diagram-1": "https://your-r2-bucket.com/articles/abc123/diagrams/diagram-1.png"
}
```

## Rollback

If you need to rollback this migration:

```sql
ALTER TABLE articles DROP COLUMN diagram_images;
```

Note: This will not affect existing functionality, diagrams will just be regenerated on each download.
