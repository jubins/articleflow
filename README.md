# ContentForge

ContentForge is an AI-powered content automation pipeline that generates technical articles for Medium, Dev.to, and DZone using Claude (Anthropic) or Gemini (Google AI) APIs.

## Features

- **AI-Powered Article Generation**: Generate high-quality technical articles using Claude or Gemini APIs
- **Multiple Platform Support**: Create articles optimized for Medium, Dev.to, and DZone
- **Google Sheets Integration**: Sync prompts from Google Sheets for batch processing
- **Google Docs Export**: Automatically create formatted Google Docs for your articles
- **Markdown Export**: Generate and store markdown files in Supabase Storage
- **User Management**: Secure authentication with Supabase Auth
- **Dashboard**: Track all your articles with status monitoring
- **Customizable Templates**: Create custom article generation templates
- **Settings Management**: Configure API keys and preferences per user

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **AI Providers**: Claude API (Anthropic), Gemini API (Google AI)
- **Integrations**: Google Sheets API, Google Docs API

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration: `supabase/migrations/20241217_initial_schema.sql`
3. Get your API keys from Settings > API

### 3. Configure Environment Variables

```bash
cp .env.template .env.local
```

Edit `.env.local` with your credentials (see below for details).

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Detailed Setup

### Prerequisites

- Node.js 18+
- Supabase account
- Claude API key OR Gemini API key
- Google Cloud project with service account (for Sheets/Docs integration)

### Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers (at least one required)
ANTHROPIC_API_KEY=sk-ant-your-key
GOOGLE_AI_API_KEY=AIza-your-key

# Google Cloud (for Sheets/Docs)
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id

# Google Sheets ID (optional, can be set per user)
GOOGLE_SHEETS_ID=your-sheet-id
```

### Google Sheets Format

Your Google Sheet should have these columns in the "generator" tab:

| Topics | Prompt | FileId | GeneratedDate |
|--------|--------|--------|---------------|
| Article title/topic | Detailed prompt | custom-file-id | (auto-filled) |

## Usage

1. **Sign Up**: Create an account at `/signup`
2. **Configure Settings**: Add your API keys in Settings
3. **Generate Article**:
   - Manual: Use the Generate page
   - Batch: Sync from Google Sheets via API
4. **View Dashboard**: Track all generated articles

## API Endpoints

- `POST /api/generate` - Generate an article
- `POST /api/sheets/sync` - Sync prompts from Google Sheets
- `POST /api/docs/create` - Create Google Doc for article
- `POST /api/storage/upload` - Upload markdown to storage

## Database Schema

See `supabase/DATABASE_SCHEMA.md` for complete schema documentation.

Key tables:
- `profiles` - User profiles
- `user_settings` - API keys and preferences
- `prompts` - Article prompts
- `articles` - Generated articles
- `generation_logs` - Generation history

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Troubleshooting

- **"User settings not found"**: Configure API keys in Settings
- **"Failed to access Google Sheets"**: Share sheet with service account email
- **"Failed to generate article"**: Verify API key is valid

See full documentation in individual `README.md` files in subdirectories.

## License

MIT
