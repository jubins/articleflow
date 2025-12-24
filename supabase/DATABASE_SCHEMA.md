# ArticleFlow Database Schema

## Overview
This document describes the database schema for ArticleFlow, a content automation pipeline that generates technical articles for Medium, Dev.to, and DZone using AI.

## Tables

### 1. profiles
Extends Supabase auth.users with additional user information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, REFERENCES auth.users(id) | User ID from Supabase Auth |
| email | text | NOT NULL | User email |
| full_name | text | | User's full name |
| created_at | timestamptz | DEFAULT now() | Account creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

### 2. user_settings
Stores user-specific configuration and API keys (encrypted).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique setting ID |
| user_id | uuid | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | User ID |
| anthropic_api_key | text | | Encrypted Claude API key |
| google_ai_api_key | text | | Encrypted Gemini API key |
| google_sheets_id | text | | Google Sheets ID for prompt sync |
| default_ai_provider | text | DEFAULT 'claude' | Default AI provider (claude/gemini) |
| default_word_count | integer | DEFAULT 2000 | Default article word count |
| article_template | text | | Custom article generation template |
| created_at | timestamptz | DEFAULT now() | Settings creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_user_settings_user_id` ON user_id

### 3. prompts
Stores prompts from manual entry or Google Sheets sync.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique prompt ID |
| user_id | uuid | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | User ID |
| topic | text | NOT NULL | Article topic/title |
| prompt_text | text | NOT NULL | Detailed prompt for generation |
| file_id | text | | File ID for naming outputs (from sheets) |
| source | text | NOT NULL, CHECK (source IN ('manual', 'sheets')) | Prompt source |
| processed | boolean | DEFAULT false | Whether prompt has been processed |
| sheet_row_number | integer | | Row number in Google Sheets (if from sheets) |
| created_at | timestamptz | DEFAULT now() | Prompt creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_prompts_user_id` ON user_id
- `idx_prompts_processed` ON processed
- `idx_prompts_source` ON source

### 4. articles
Stores generated articles with metadata and file references.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique article ID |
| user_id | uuid | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | User ID |
| prompt_id | uuid | REFERENCES prompts(id) ON DELETE SET NULL | Associated prompt |
| title | text | NOT NULL | Article title |
| content | text | NOT NULL | Full article content (HTML/Markdown) |
| description | text | | Article description/excerpt |
| tags | text[] | DEFAULT '{}' | Article tags |
| word_count | integer | | Actual word count |
| platform | text | NOT NULL, CHECK (platform IN ('medium', 'devto', 'dzone', 'all')) | Target platform |
| status | text | NOT NULL, DEFAULT 'draft', CHECK (status IN ('draft', 'generated', 'published', 'failed')) | Article status |
| ai_provider | text | NOT NULL | AI provider used (claude/gemini) |
| google_doc_id | text | | Google Doc file ID |
| google_doc_url | text | | Google Doc URL |
| file_id | text | | File ID used for naming |
| generation_metadata | jsonb | DEFAULT '{}' | Additional generation metadata |
| error_message | text | | Error message if generation failed |
| generated_at | timestamptz | | Timestamp when article was generated |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_articles_user_id` ON user_id
- `idx_articles_prompt_id` ON prompt_id
- `idx_articles_status` ON status
- `idx_articles_platform` ON platform
- `idx_articles_generated_at` ON generated_at

### 5. generation_logs
Tracks all generation attempts for debugging and analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique log ID |
| user_id | uuid | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | User ID |
| article_id | uuid | REFERENCES articles(id) ON DELETE SET NULL | Associated article |
| action | text | NOT NULL | Action performed (generate/create_doc/upload_markdown) |
| status | text | NOT NULL, CHECK (status IN ('started', 'success', 'failed')) | Action status |
| ai_provider | text | | AI provider used |
| duration_ms | integer | | Duration in milliseconds |
| error_message | text | | Error message if failed |
| metadata | jsonb | DEFAULT '{}' | Additional metadata |
| created_at | timestamptz | DEFAULT now() | Log creation timestamp |

**Indexes:**
- `idx_generation_logs_user_id` ON user_id
- `idx_generation_logs_article_id` ON article_id
- `idx_generation_logs_status` ON status
- `idx_generation_logs_created_at` ON created_at

## Row Level Security (RLS) Policies

All tables have RLS enabled with the following policies:

### profiles
- Users can view their own profile
- Users can update their own profile

### user_settings
- Users can view their own settings
- Users can insert/update/delete their own settings

### prompts
- Users can view their own prompts
- Users can insert/update/delete their own prompts

### articles
- Users can view their own articles
- Users can insert/update/delete their own articles

### generation_logs
- Users can view their own logs
- System can insert logs for any user

## Storage Buckets

### articles-markdown
Stores markdown files for Dev.to and other platforms.

**Policies:**
- Users can upload files to their own folder (user_id/*)
- Users can view/download files from their own folder
- Users can delete files from their own folder

## Functions

### handle_new_user()
Trigger function that creates a profile entry when a new user signs up.

### update_updated_at()
Trigger function that automatically updates the `updated_at` column on row updates.

## Notes

1. All timestamps use `timestamptz` for timezone awareness
2. Sensitive data (API keys) should be encrypted at application level before storage
3. The `file_id` column in articles table corresponds to the FileId from Google Sheets
4. The `generation_metadata` JSONB field allows storing flexible data like token usage, model version, etc.
5. RLS policies ensure data isolation between users
