# Google OAuth Setup Guide for ContentForge

## Overview

ContentForge now uses **Google OAuth** for user authentication instead of service accounts. This means:
- ✅ Users connect their own Google accounts
- ✅ No need for service account JSON files
- ✅ Users manage their own API keys through the UI
- ✅ True multi-tenant architecture

## Prerequisites

1. A Google Cloud Project
2. Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Required APIs

1. Go to **APIs & Services > Library**
2. Search for and enable:
   - **Google Sheets API**
   - **Google Docs API**
   - **Google Drive API**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - **User Type**: External (unless you have a Google Workspace)
   - **App name**: ContentForge
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **Scopes**: Add these scopes:
     - `https://www.googleapis.com/auth/spreadsheets.readonly`
     - `https://www.googleapis.com/auth/documents`
     - `https://www.googleapis.com/auth/drive.file`
   - **Test users**: Add your email (required for External apps in testing)

4. Back to **Create OAuth client ID**:
   - **Application type**: Web application
   - **Name**: ContentForge OAuth
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/integrations/google/callback` (development)
     - `https://your-production-domain.com/api/integrations/google/callback` (production)
   - Click **Create**

5. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

Update your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-your-client-secret

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Run Database Migration

Run the new migration to add OAuth support:

```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/20241217_add_oauth_support.sql
```

Or manually add the columns:

```sql
ALTER TABLE user_settings
ADD COLUMN google_access_token TEXT,
ADD COLUMN google_refresh_token TEXT,
ADD COLUMN google_token_expires_at TIMESTAMPTZ,
ADD COLUMN google_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN google_connected_at TIMESTAMPTZ;
```

## How It Works

### User Flow

1. **User signs up/logs in** to ContentForge
2. **Goes to Integrations page** (`/integrations`)
3. **Clicks "Connect Google Account"**
4. **Redirected to Google OAuth consent screen**
5. **Grants permissions** (read sheets, create docs)
6. **Redirected back** to ContentForge
7. **OAuth tokens stored** in their user_settings record

### For Developers

The system now works like this:

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Clicks "Connect Google"
       ▼
┌─────────────────────────────┐
│  /api/integrations/google/  │
│          auth               │
└──────────┬──────────────────┘
           │
           │ 2. Generates OAuth URL
           ▼
┌─────────────────────────────┐
│   Google OAuth Consent      │
│         Screen              │
└──────────┬──────────────────┘
           │
           │ 3. User grants permissions
           ▼
┌─────────────────────────────┐
│  /api/integrations/google/  │
│        callback             │
└──────────┬──────────────────┘
           │
           │ 4. Stores tokens in DB
           ▼
┌─────────────────────────────┐
│    User can now:            │
│  - Read Google Sheets       │
│  - Create Google Docs       │
│  - All with their own       │
│    Google account!          │
└─────────────────────────────┘
```

## API Keys Management

Users now manage their own API keys through the Integrations page:

- **Claude API Key** (Anthropic)
- **Gemini API Key** (Google AI)

These are stored encrypted in the `user_settings` table per user.

## Security Notes

1. **OAuth tokens are stored per user** - each user has their own credentials
2. **Tokens auto-refresh** - the system automatically refreshes expired tokens
3. **Users can disconnect** anytime - removes all stored tokens
4. **No shared credentials** - no service account JSON files needed
5. **Proper scopes** - only requests necessary permissions

## Troubleshooting

### "OAuth not configured" error

- Make sure `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are set in `.env.local`

### "Redirect URI mismatch" error

- Add the callback URI to authorized redirect URIs in Google Cloud Console
- Make sure the URL matches exactly (including http/https and port)

### "App is not verified" warning

- Normal for apps in testing mode
- Click "Advanced" and then "Go to ContentForge (unsafe)" during testing
- For production, submit your app for verification

### "Access blocked: This app's request is invalid"

- Check that all required scopes are added in the OAuth consent screen
- Make sure APIs are enabled in Google Cloud

## Production Deployment

For production:

1. Update redirect URIs in Google Cloud Console
2. Add production domain to authorized origins
3. Set correct `NEXT_PUBLIC_APP_URL` in production environment
4. Consider getting your app verified by Google

## Comparison: Old vs New

### Old Architecture (Service Account)
❌ Single service account for all users
❌ Shared credentials in environment variables
❌ Limited to service account permissions
❌ Complex setup with JSON key files

### New Architecture (OAuth)
✅ Each user uses their own Google account
✅ No shared credentials
✅ Users control their own permissions
✅ Simple OAuth flow
✅ Better security and privacy

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Docs API](https://developers.google.com/docs/api)
