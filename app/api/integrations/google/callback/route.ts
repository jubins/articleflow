import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

// Force Node.js runtime for googleapis compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Handle Google OAuth callback
 * GET /api/integrations/google/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // user_id
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=missing_parameters', request.url)
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== state) {
      return NextResponse.redirect(
        new URL('/settings?error=unauthorized', request.url)
      )
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/settings?error=no_access_token', request.url)
      )
    }

    // Calculate token expiry
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString() // Default 1 hour

    // Store tokens in user_settings
    const { error: updateError } = await supabase
      .from('user_settings')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      .upsert({
        user_id: user.id,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token || null,
        google_token_expires_at: expiresAt,
        google_connected: true,
        google_connected_at: new Date().toISOString(),
      })

    if (updateError) {
      console.error('Error storing Google tokens:', updateError)
      return NextResponse.redirect(
        new URL('/settings?error=storage_failed', request.url)
      )
    }

    // Success! Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/settings?google_connected=true', request.url)
    )
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent('callback_failed')}`, request.url)
    )
  }
}
