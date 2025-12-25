import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

/**
 * Initiate Google OAuth flow
 * GET /api/integrations/google/auth
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check for required environment variables
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET' },
        { status: 500 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
    )

    // Generate OAuth URL with required scopes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets.readonly', // Read Google Sheets
        'https://www.googleapis.com/auth/documents', // Create/edit Google Docs
        'https://www.googleapis.com/auth/drive.file', // Create files in Drive
      ],
      state: user.id, // Pass user ID to identify on callback
      prompt: 'consent', // Force consent screen to get refresh token
    })

    return NextResponse.json({
      success: true,
      authUrl,
    })
  } catch (error) {
    console.error('Google OAuth initiation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to initiate Google OAuth',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
