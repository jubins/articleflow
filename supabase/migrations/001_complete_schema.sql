-- ArticleFlow Complete Database Schema
-- This is a comprehensive schema containing all tables, policies, and features
-- Version: 1.0
-- Date: 2024-12-17

-- ==================================================
-- EXTENSIONS
-- ==================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- TABLES
-- ==================================================

-- Profiles table (user information)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,

    -- Social media profiles for article signatures
    linkedin_handle TEXT,
    twitter_handle TEXT,
    github_handle TEXT,
    bio TEXT,
    website TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON COLUMN profiles.linkedin_handle IS 'LinkedIn username (e.g., johndoe)';
COMMENT ON COLUMN profiles.twitter_handle IS 'Twitter/X username (e.g., @johndoe)';
COMMENT ON COLUMN profiles.github_handle IS 'GitHub username (e.g., johndoe)';
COMMENT ON COLUMN profiles.bio IS 'Short professional bio for article signatures';
COMMENT ON COLUMN profiles.website IS 'Personal or professional website URL';

-- User settings table (API keys, preferences, OAuth tokens)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- User-provided AI API keys
    anthropic_api_key TEXT,
    google_ai_api_key TEXT,

    -- Google OAuth tokens for Sheets/Docs access
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expires_at TIMESTAMPTZ,
    google_connected BOOLEAN DEFAULT FALSE,
    google_connected_at TIMESTAMPTZ,

    -- Default settings
    google_sheets_id TEXT,
    default_ai_provider TEXT DEFAULT 'claude' CHECK (default_ai_provider IN ('claude', 'gemini')),
    default_word_count INTEGER DEFAULT 2000,
    article_template TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

COMMENT ON COLUMN user_settings.anthropic_api_key IS 'User-provided Claude API key';
COMMENT ON COLUMN user_settings.google_ai_api_key IS 'User-provided Gemini API key';
COMMENT ON COLUMN user_settings.google_access_token IS 'OAuth access token for Google APIs';
COMMENT ON COLUMN user_settings.google_refresh_token IS 'OAuth refresh token for Google APIs';

-- Prompts table (individual article prompts)
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    file_id TEXT,
    source TEXT NOT NULL CHECK (source IN ('manual', 'sheets')),
    processed BOOLEAN DEFAULT FALSE NOT NULL,
    sheet_row_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workflows table (batch article generation workflows)
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,

    -- Input source: 'google_sheets' or 'manual'
    source_type TEXT NOT NULL CHECK (source_type IN ('google_sheets', 'manual')),

    -- Google Sheets configuration (if source_type = 'google_sheets')
    google_sheets_id TEXT,
    sheet_name TEXT DEFAULT 'generator',
    title_column TEXT DEFAULT 'A', -- Column for article title
    prompt_column TEXT DEFAULT 'B', -- Column for prompt
    file_id_column TEXT DEFAULT 'C', -- Column for file ID

    -- Generation settings
    ai_provider TEXT NOT NULL CHECK (ai_provider IN ('claude', 'gemini')),
    target_platform TEXT NOT NULL CHECK (target_platform IN ('medium', 'devto', 'dzone', 'all')),
    word_count INTEGER DEFAULT 2000,
    article_template TEXT,

    -- Output settings
    create_google_doc BOOLEAN DEFAULT TRUE,
    save_markdown BOOLEAN DEFAULT TRUE,
    auto_approve BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    total_articles_generated INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON COLUMN workflows.auto_approve IS 'Auto-approve articles without manual review';

-- Articles table (generated articles)
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    word_count INTEGER,
    platform TEXT NOT NULL CHECK (platform IN ('medium', 'devto', 'dzone', 'all')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'published', 'failed')),
    ai_provider TEXT NOT NULL,
    google_doc_id TEXT,
    google_doc_url TEXT,
    markdown_url TEXT,
    file_id TEXT,
    generation_metadata JSONB DEFAULT '{}',
    error_message TEXT,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workflow items table (for manual prompt lists)
CREATE TABLE IF NOT EXISTS workflow_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    file_id TEXT,
    position INTEGER NOT NULL DEFAULT 0, -- Order in the list
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Generation logs table (audit trail for article generation)
CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed')),
    ai_provider TEXT,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==================================================
-- INDEXES
-- ==================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- User Settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Workflows
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_source_type ON workflows(source_type);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);

-- Workflow Items
CREATE INDEX IF NOT EXISTS idx_workflow_items_workflow_id ON workflow_items(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_items_status ON workflow_items(status);
CREATE INDEX IF NOT EXISTS idx_workflow_items_position ON workflow_items(workflow_id, position);

-- Prompts
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_processed ON prompts(processed);
CREATE INDEX IF NOT EXISTS idx_prompts_source ON prompts(source);

-- Articles
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_prompt_id ON articles(prompt_id);
CREATE INDEX IF NOT EXISTS idx_articles_workflow_id ON articles(workflow_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_platform ON articles(platform);
CREATE INDEX IF NOT EXISTS idx_articles_generated_at ON articles(generated_at);

-- Generation Logs
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_article_id ON generation_logs(article_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_status ON generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at);

-- ==================================================
-- FUNCTIONS
-- ==================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );

    -- Create default user settings
    INSERT INTO user_settings (user_id, default_ai_provider, default_word_count)
    VALUES (
        NEW.id,
        'claude',
        2000
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- TRIGGERS
-- ==================================================

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workflow_items_updated_at
    BEFORE UPDATE ON workflow_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER prompts_updated_at
    BEFORE UPDATE ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ==================================================
-- ROW LEVEL SECURITY
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- User Settings policies
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON user_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Workflows policies
CREATE POLICY "Users can view their own workflows"
    ON workflows FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows"
    ON workflows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
    ON workflows FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
    ON workflows FOR DELETE
    USING (auth.uid() = user_id);

-- Workflow Items policies
CREATE POLICY "Users can view their own workflow items"
    ON workflow_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.id = workflow_items.workflow_id
            AND workflows.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own workflow items"
    ON workflow_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.id = workflow_items.workflow_id
            AND workflows.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own workflow items"
    ON workflow_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.id = workflow_items.workflow_id
            AND workflows.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own workflow items"
    ON workflow_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.id = workflow_items.workflow_id
            AND workflows.user_id = auth.uid()
        )
    );

-- Prompts policies
CREATE POLICY "Users can view their own prompts"
    ON prompts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts"
    ON prompts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
    ON prompts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
    ON prompts FOR DELETE
    USING (auth.uid() = user_id);

-- Articles policies
CREATE POLICY "Users can view their own articles"
    ON articles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles"
    ON articles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
    ON articles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
    ON articles FOR DELETE
    USING (auth.uid() = user_id);

-- Generation Logs policies
CREATE POLICY "Users can view their own logs"
    ON generation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
    ON generation_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==================================================
-- STORAGE
-- ==================================================

-- Create storage bucket for markdown files
INSERT INTO storage.buckets (id, name, public)
VALUES ('articles-markdown', 'articles-markdown', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for articles-markdown bucket
CREATE POLICY "Users can upload markdown files to their own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'articles-markdown' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own markdown files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'articles-markdown' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own markdown files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'articles-markdown' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
