import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markdownToHtml } from '@/lib/utils/markdown'

export async function POST(request: NextRequest) {
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

    const { title, content, articleType } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Ensure user profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      // Create profile if it doesn't exist
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null,
      })
    }

    // Ensure user settings exist
    const { data: settings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!settings) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await supabase.from('user_settings').insert({
        user_id: user.id,
        default_ai_provider: 'gemini',
        default_word_count: 2000,
      })
    }

    // Convert markdown to HTML for rich text storage
    const richTextHtml = markdownToHtml(content)

    // Calculate word count
    const wordCount = content.split(/\s+/).filter(Boolean).length

    // Create article record
    const { data: article, error: articleError } = await supabase
      .from('articles')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      .insert({
        user_id: user.id,
        title,
        content,
        rich_text_content: richTextHtml,
        platform: 'all',
        article_type: articleType || 'tutorial',
        status: 'generated',
        ai_provider: 'gemini',
        word_count: wordCount,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (articleError || !article) {
      console.error('Failed to save trial article:', articleError)
      return NextResponse.json(
        { error: 'Failed to save article' },
        { status: 500 }
      )
    }

    const typedArticle = article as { id: string }

    return NextResponse.json({
      success: true,
      articleId: typedArticle.id
    })
  } catch (error) {
    console.error('Error saving trial article:', error)
    return NextResponse.json(
      { error: 'Failed to save article' },
      { status: 500 }
    )
  }
}
