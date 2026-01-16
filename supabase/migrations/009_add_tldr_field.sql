-- Migration: Add tldr field to articles table
-- Description: Adds a tldr (Too Long; Didn't Read) field to store short summaries of articles (135 characters max)

-- Add tldr column to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS tldr TEXT NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.articles.tldr IS 'TL;DR summary of the article (135 characters max)';

-- Create index for full-text search on tldr if needed in future
CREATE INDEX IF NOT EXISTS idx_articles_tldr ON public.articles USING btree (tldr);
