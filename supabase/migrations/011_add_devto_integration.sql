-- Migration: Add Dev.to integration and publication tracking
-- Created: 2025-01-17

-- Add Dev.to API key to user_settings
ALTER TABLE user_settings
ADD COLUMN devto_api_key TEXT;

-- Create article_publications table to track where articles are published
CREATE TABLE article_publications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'devto', 'medium', 'hashnode', etc.
  published_url TEXT NOT NULL,
  platform_article_id TEXT, -- External platform's article ID
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- Store platform-specific metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX idx_article_publications_article_id ON article_publications(article_id);
CREATE INDEX idx_article_publications_user_id ON article_publications(user_id);
CREATE INDEX idx_article_publications_platform ON article_publications(platform);

-- Ensure unique publications per article per platform
CREATE UNIQUE INDEX idx_unique_article_platform ON article_publications(article_id, platform);

-- Enable Row Level Security
ALTER TABLE article_publications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_publications
CREATE POLICY "Users can view their own publications"
  ON article_publications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own publications"
  ON article_publications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own publications"
  ON article_publications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own publications"
  ON article_publications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE article_publications IS 'Tracks article publications to external platforms (Dev.to, Medium, etc.)';
