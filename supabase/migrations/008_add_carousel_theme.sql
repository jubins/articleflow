-- Add carousel_theme column to user_settings table
-- Stores the preferred slide background theme for carousel presentations

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS carousel_theme TEXT DEFAULT 'classic';

COMMENT ON COLUMN user_settings.carousel_theme IS 'Preferred carousel slide background theme: classic, academic, modern, elegant, professional';

-- Add check constraint to ensure valid theme values
ALTER TABLE user_settings
  DROP CONSTRAINT IF EXISTS carousel_theme_check;

ALTER TABLE user_settings
  ADD CONSTRAINT carousel_theme_check
  CHECK (carousel_theme IN ('classic', 'academic', 'modern', 'elegant', 'professional'));
