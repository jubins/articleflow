# Supabase Setup for ArticleFlow

## Overview
This directory contains the database schema, migrations, and configuration for ArticleFlow's Supabase backend.

## Prerequisites
- A Supabase account (https://supabase.com)
- Supabase CLI installed (optional, for local development)

## Setup Instructions

### 1. Create a Supabase Project
1. Go to https://supabase.com and create a new project
2. Note down your project URL and publishable key (formerly called anon key)
3. Wait for the project to be fully initialized

### 2. Run the Migration
You have two options:

#### Option A: Using Supabase Dashboard (Recommended for first-time setup)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `migrations/20241217_initial_schema.sql`
4. Paste into the SQL Editor and click **Run**

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 3. Update Environment Variables
Update your `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Verify Setup
After running the migration, verify that the following tables exist:
- `profiles`
- `user_settings`
- `prompts`
- `articles`
- `generation_logs`

And the storage bucket:
- `articles-markdown`

## Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed schema documentation.

## Storage Configuration

The `articles-markdown` bucket is configured with Row Level Security (RLS) policies that ensure:
- Users can only upload files to their own folder (based on user_id)
- Users can only view and delete their own files
- Files are stored in the format: `{user_id}/{file_id}.md`

## Security Notes

1. **API Keys**: Never commit real API keys to version control
2. **RLS**: All tables have Row Level Security enabled
3. **Service Role Key**: Only use the service role key in secure server-side contexts
4. **Encryption**: Consider encrypting sensitive data (like API keys in user_settings) at the application level

## Troubleshooting

### Migration Fails
- Ensure your Supabase project is fully initialized
- Check that you have the necessary permissions
- Verify that the `uuid-ossp` extension is enabled

### RLS Policies Not Working
- Verify that auth.uid() returns the correct user ID
- Check that you're using the authenticated Supabase client, not the service role client

### Storage Bucket Issues
- Ensure the bucket is created before attempting uploads
- Verify storage policies are correctly applied
- Check that file paths follow the pattern: `{user_id}/{filename}`

## Local Development

For local development with Supabase, you can use the Supabase CLI:

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database (warning: deletes all data)
supabase db reset
```

## Production Deployment

When deploying to production:
1. Create a production Supabase project
2. Run migrations on the production database
3. Update production environment variables
4. Test thoroughly before going live
