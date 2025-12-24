-- QUICK FIX: Add missing columns to articles table
-- Run this in Supabase Dashboard → SQL Editor
-- This will fix the "Could not find the 'file_id' column" error

-- Add file_id column if it doesn't exist
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS file_id TEXT;

-- Add rich_text_content if it doesn't exist
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS rich_text_content TEXT;

-- Add article_type if it doesn't exist
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS article_type TEXT DEFAULT 'technical';

-- Add comments
COMMENT ON COLUMN articles.file_id IS 'Custom file ID for naming article outputs';
COMMENT ON COLUMN articles.rich_text_content IS 'Rich text HTML content converted from markdown';
COMMENT ON COLUMN articles.article_type IS 'Type of article: technical, tutorial, comparison, best-practices, case-study, carousel';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_articles_file_id ON articles(file_id);
CREATE INDEX IF NOT EXISTS idx_articles_has_rich_text ON articles((rich_text_content IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_articles_article_type ON articles(article_type);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'articles'
  AND column_name IN ('file_id', 'rich_text_content', 'article_type')
ORDER BY column_name;
