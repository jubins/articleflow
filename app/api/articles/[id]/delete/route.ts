import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the article belongs to the user
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('id, user_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((article as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this article' },
        { status: 403 }
      )
    }

    // Delete the article
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id) // Extra safety check

    if (deleteError) {
      throw deleteError
    }

    // Log the deletion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('generation_logs').insert({
      user_id: user.id,
      article_id: params.id,
      action: 'delete',
      status: 'success',
      metadata: {},
    })

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully'
    })

  } catch (error) {
    console.error('Article deletion error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete article',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
