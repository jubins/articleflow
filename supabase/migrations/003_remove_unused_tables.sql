-- Remove unused tables (prompts, workflows, workflow_items)
-- These tables were part of the initial design but are no longer used
-- Migration: 003_remove_unused_tables.sql
-- Date: 2024-12-24

-- Drop foreign key constraints first
ALTER TABLE IF EXISTS workflow_items DROP CONSTRAINT IF EXISTS workflow_items_workflow_id_fkey;
ALTER TABLE IF EXISTS workflow_items DROP CONSTRAINT IF EXISTS workflow_items_article_id_fkey;
ALTER TABLE IF EXISTS workflows DROP CONSTRAINT IF EXISTS workflows_user_id_fkey;
ALTER TABLE IF EXISTS prompts DROP CONSTRAINT IF EXISTS prompts_user_id_fkey;
ALTER TABLE IF EXISTS articles DROP CONSTRAINT IF EXISTS articles_prompt_id_fkey;
ALTER TABLE IF EXISTS articles DROP CONSTRAINT IF EXISTS articles_workflow_id_fkey;

-- Drop workflow_items table
DROP TABLE IF EXISTS workflow_items CASCADE;

-- Drop workflows table
DROP TABLE IF EXISTS workflows CASCADE;

-- Drop prompts table
DROP TABLE IF EXISTS prompts CASCADE;

-- Remove unused columns from articles table
ALTER TABLE articles DROP COLUMN IF EXISTS prompt_id;
ALTER TABLE articles DROP COLUMN IF EXISTS workflow_id;

-- Note: This migration removes tables that were part of the original design
-- but are not used in the current implementation. The application now focuses
-- on direct article generation without workflows or prompts.
