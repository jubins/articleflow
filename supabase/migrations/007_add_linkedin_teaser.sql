-- Add linkedin_teaser column to articles table
-- This stores the LinkedIn post teaser text generated once at creation time

ALTER TABLE articles ADD COLUMN IF NOT EXISTS linkedin_teaser TEXT;

COMMENT ON COLUMN articles.linkedin_teaser IS 'LinkedIn post teaser text for carousel articles, generated once at creation';

-- Add index for future queries that might filter by teaser presence
CREATE INDEX IF NOT EXISTS idx_articles_has_linkedin_teaser ON articles((linkedin_teaser IS NOT NULL));
