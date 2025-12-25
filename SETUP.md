# ArticleFlow Setup Guide

## Environment Variables Configuration

Your application requires several environment variables to function properly. The 500 error you're seeing is likely due to missing environment variables on Vercel.

### Required Environment Variables

#### 1. Supabase Configuration (REQUIRED)
These are **absolutely required** for the app to work:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**How to get these values:**
1. Go to https://supabase.com
2. Create a new project (if you haven't already)
3. Go to Project Settings > API
4. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
6. Copy the "service_role" key for `SUPABASE_SERVICE_ROLE_KEY`

#### 2. Google OAuth (Required for Google integrations)

```env
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
```

**How to get these values:**
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Google Docs API and Google Sheets API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Set authorized redirect URIs to: `https://www.articleflow.xyz/api/integrations/google/callback`

#### 3. Application URL

```env
NEXT_PUBLIC_APP_URL=https://www.articleflow.xyz
```

#### 4. Trial Article Generation (Optional)

```env
TRIAL_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

This is YOUR Claude API key used to generate free trial articles. If not set, the trial feature won't work, but the app will still function.

#### 5. Cloudflare R2 Storage (Required for Mermaid diagrams)

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=articleflow-diagrams
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

**How to get these values:**
1. Go to https://dash.cloudflare.com
2. Navigate to R2 Object Storage
3. Create a new bucket called "articleflow-diagrams"
4. Create API tokens under "Manage R2 API Tokens"

---

## Setting Environment Variables on Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your "articleflow" project
3. Go to "Settings" > "Environment Variables"
4. Add each variable one by one:
   - Variable name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase project URL
   - Environment: Production, Preview, Development (select all)
   - Click "Save"
5. Repeat for all required variables

**After adding all variables:**
1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Select "Redeploy" to apply the new environment variables

---

## Quick Fix for Current 500 Error

The immediate issue is that Supabase environment variables are missing. To fix:

1. **Add Supabase variables** to Vercel (see above)
2. **Redeploy** the application
3. The 500 error should be resolved

---

## Testing Locally

To test locally, create a `.env.local` file in the project root with all the variables from `.env.example`.

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
npm install
npm run dev
```

---

## Troubleshooting

### Still seeing 500 errors?

1. Check Vercel logs:
   - Go to your deployment in Vercel
   - Click on "Functions" or "Runtime Logs"
   - Look for error messages

2. Verify all environment variables are set:
   - Go to Settings > Environment Variables
   - Ensure all required variables are present

3. Check that variables are applied to all environments:
   - Each variable should be checked for Production, Preview, and Development

### How to view Vercel logs:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs --prod
```

---

## Priority Order

If you need to get the app working quickly, configure these in order:

1. **Supabase variables** (REQUIRED for app to start)
2. **App URL** (REQUIRED for proper redirects)
3. **R2 Storage** (REQUIRED for Mermaid diagram features)
4. **Google OAuth** (Optional, for integrations)
5. **Trial API Key** (Optional, for free trial feature)
