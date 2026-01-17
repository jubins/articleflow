import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update profile to remove avatar URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error removing avatar:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove avatar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully'
    })
  } catch (error) {
    console.error('Avatar deletion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove avatar' },
      { status: 500 }
    )
  }
}
