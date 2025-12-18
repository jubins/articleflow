-- Add Workflow System to ContentForge
-- Migration: Add workflows and workflow_items tables

-- Create workflows table
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

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    total_articles_generated INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create workflow_items table (for manual lists)
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

-- Add workflow_id to articles table
ALTER TABLE articles
ADD COLUMN workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_source_type ON workflows(source_type);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_items_workflow_id ON workflow_items(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_items_status ON workflow_items(status);
CREATE INDEX IF NOT EXISTS idx_workflow_items_position ON workflow_items(workflow_id, position);
CREATE INDEX IF NOT EXISTS idx_articles_workflow_id ON articles(workflow_id);

-- Update triggers for updated_at
CREATE TRIGGER workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workflow_items_updated_at
    BEFORE UPDATE ON workflow_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS Policies for workflows
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for workflow_items
ALTER TABLE workflow_items ENABLE ROW LEVEL SECURITY;

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
