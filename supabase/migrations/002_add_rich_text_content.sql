-- Add rich_text_content column to articles table
-- This stores the rich text HTML version of the article
-- Migration: 002_add_rich_text_content.sql
-- Date: 2024-12-24

-- Add rich_text_content column
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS rich_text_content TEXT;

-- Add comment to document the column
COMMENT ON COLUMN articles.rich_text_content IS 'Rich text HTML content converted from markdown';

-- Create index for faster queries (optional, but good for performance)
CREATE INDEX IF NOT EXISTS idx_articles_has_rich_text ON articles((rich_text_content IS NOT NULL));

-- Note: We're keeping markdown_url for backward compatibility but will deprecate it
-- New articles should store content directly in the database
COMMENT ON COLUMN articles.markdown_url IS 'DEPRECATED: Use content column instead. Kept for backward compatibility.';
