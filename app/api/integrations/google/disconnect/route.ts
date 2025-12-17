import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Disconnect Google integration
 * POST /api/integrations/google/disconnect
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Clear Google OAuth tokens
    const { error: updateError } = await supabase
      .from('user_settings')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        google_connected: false,
        google_connected_at: null,
      })
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to disconnect Google' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Google integration disconnected successfully',
    })
  } catch (error) {
    console.error('Google disconnect error:', error)
    return NextResponse.json(
      {
        error: 'Failed to disconnect Google',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
