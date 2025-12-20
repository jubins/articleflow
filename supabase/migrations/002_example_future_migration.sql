-- Example Future Migration
-- Copy this template when you need to make future database changes
-- Rename to: 002_descriptive_name.sql, 003_another_change.sql, etc.

-- ==================================================
-- DESCRIPTION
-- ==================================================
-- What this migration does:
-- - Add new columns
-- - Create new tables
-- - Modify existing structures
-- - Add new policies

-- ==================================================
-- CHANGES
-- ==================================================

-- Example: Add a new column to user_settings
-- ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS new_setting TEXT;

-- Example: Create a new table
-- CREATE TABLE IF NOT EXISTS new_table (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
-- );

-- Example: Add RLS policy
-- ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own records"
--     ON new_table FOR SELECT
--     USING (auth.uid() = user_id);

-- ==================================================
-- ROLLBACK (Optional - for reference only)
-- ==================================================
-- Instructions to undo this migration if needed:
-- - DROP COLUMN commands
-- - DROP TABLE commands
-- - DROP POLICY commands
