// Google OAuth helper for user-authenticated API access
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export interface GoogleOAuthTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: string
}

/**
 * Get OAuth2 client with user's tokens
 */
export async function getGoogleOAuthClient(userId: string) {
  const supabase = await createClient()

  // Get user's Google tokens
  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_connected')
    .eq('user_id', userId)
    .single()

  if (error || !settings || !settings.google_connected) {
    throw new Error('Google account not connected. Please connect your Google account in Settings.')
  }

  if (!settings.google_access_token) {
    throw new Error('No Google access token found')
  }

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
  )

  // Set credentials
  oauth2Client.setCredentials({
    access_token: settings.google_access_token,
    refresh_token: settings.google_refresh_token || undefined,
    expiry_date: settings.google_token_expires_at ? new Date(settings.google_token_expires_at).getTime() : undefined,
  })

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString()

      await supabase
        .from('user_settings')
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token || settings.google_refresh_token,
          google_token_expires_at: expiresAt,
        })
        .eq('user_id', userId)
    }
  })

  return oauth2Client
}

/**
 * Check if token needs refresh
 */
export function tokenNeedsRefresh(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  const expiryTime = new Date(expiresAt).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  return expiryTime - now < fiveMinutes
}

/**
 * Refresh user's Google access token
 */
export async function refreshGoogleToken(userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('google_refresh_token')
    .eq('user_id', userId)
    .single()

  if (!settings?.google_refresh_token) {
    throw new Error('No refresh token available')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    refresh_token: settings.google_refresh_token,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token')
  }

  const expiresAt = credentials.expiry_date
    ? new Date(credentials.expiry_date).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString()

  await supabase
    .from('user_settings')
    .update({
      google_access_token: credentials.access_token,
      google_token_expires_at: expiresAt,
    })
    .eq('user_id', userId)
}
