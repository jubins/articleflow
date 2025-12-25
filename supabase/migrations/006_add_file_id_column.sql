-- Add file_id column to articles table
-- This column stores a custom file ID for naming outputs
-- Migration: 006_add_file_id_column.sql
-- Date: 2024-12-24

-- Add file_id column if it doesn't exist
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS file_id TEXT;

-- Add comment to document the column
COMMENT ON COLUMN articles.file_id IS 'Custom file ID for naming article outputs (e.g., from Google Sheets or custom naming)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_file_id ON articles(file_id);
