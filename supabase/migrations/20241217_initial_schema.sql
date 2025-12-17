-- ContentForge Database Schema
-- Initial migration for ContentForge application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    anthropic_api_key TEXT,
    google_ai_api_key TEXT,
    google_sheets_id TEXT,
    default_ai_provider TEXT DEFAULT 'claude' CHECK (default_ai_provider IN ('claude', 'gemini')),
    default_word_count INTEGER DEFAULT 2000,
    article_template TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Create prompts table
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

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
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

-- Create generation_logs table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_processed ON prompts(processed);
CREATE INDEX IF NOT EXISTS idx_prompts_source ON prompts(source);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_prompt_id ON articles(prompt_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_platform ON articles(platform);
CREATE INDEX IF NOT EXISTS idx_articles_generated_at ON articles(generated_at);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_article_id ON generation_logs(article_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_status ON generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON user_settings
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for user_settings
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

-- RLS Policies for prompts
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

-- RLS Policies for articles
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

-- RLS Policies for generation_logs
CREATE POLICY "Users can view their own logs"
    ON generation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
    ON generation_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

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
