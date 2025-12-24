-- Add article_type column to articles table
-- This stores the type of article (technical, tutorial, carousel, etc.)
-- Migration: 004_add_article_type.sql
-- Date: 2024-12-24

-- Add article_type column
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS article_type TEXT DEFAULT 'technical';

-- Add comment to document the column
COMMENT ON COLUMN articles.article_type IS 'Type of article: technical, tutorial, comparison, best-practices, case-study, carousel';

-- Create index for filtering by article type
CREATE INDEX IF NOT EXISTS idx_articles_article_type ON articles(article_type);
