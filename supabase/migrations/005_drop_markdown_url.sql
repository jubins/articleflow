-- Drop markdown_url column from articles table
-- Content is now stored directly in the content column (markdown) and rich_text_content column (HTML)
-- Only media files are stored on R2, not text content
-- Migration: 005_drop_markdown_url.sql
-- Date: 2024-12-24

-- Drop the deprecated markdown_url column
ALTER TABLE articles
DROP COLUMN IF EXISTS markdown_url;

-- Update documentation
COMMENT ON TABLE articles IS 'Generated articles with content stored directly in database. Media files are stored on R2.';
