-- Add OAuth and integrations support to ContentForge
-- Migration: Add Google OAuth tokens and improve user_settings

-- Add OAuth columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN google_access_token TEXT,
ADD COLUMN google_refresh_token TEXT,
ADD COLUMN google_token_expires_at TIMESTAMPTZ,
ADD COLUMN google_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN google_connected_at TIMESTAMPTZ;

-- Remove server-side Google credentials (no longer needed)
-- Keep user's API keys as they provide their own
COMMENT ON COLUMN user_settings.anthropic_api_key IS 'User-provided Claude API key';
COMMENT ON COLUMN user_settings.google_ai_api_key IS 'User-provided Gemini API key';
COMMENT ON COLUMN user_settings.google_access_token IS 'OAuth access token for Google APIs';
COMMENT ON COLUMN user_settings.google_refresh_token IS 'OAuth refresh token for Google APIs';
