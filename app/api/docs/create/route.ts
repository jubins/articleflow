import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleDocsService } from '@/lib/services/google-docs'
import { Article } from '@/lib/types/database'
import { z } from 'zod'

// Force Node.js runtime for googleapis compatibility
export const runtime = 'nodejs'

// Request validation schema
const createDocRequestSchema = z.object({
  articleId: z.string().uuid(),
})

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

    // Parse request body
    const body = await request.json()
    const validatedData = createDocRequestSchema.parse(body)

    // Get the article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', validatedData.articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const typedArticle = article as Article

    // Check if Google Doc already exists
    if (typedArticle.google_doc_id) {
      return NextResponse.json(
        {
          success: true,
          message: 'Google Doc already exists',
          docId: typedArticle.google_doc_id,
          docUrl: typedArticle.google_doc_url,
        }
      )
    }

    // Create Google Docs service for user
    const docsService = await GoogleDocsService.createForUser(user.id)

    // Log start
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Supabase type inference issue with generation_logs
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      article_id: typedArticle.id,
      action: 'create_doc',
      status: 'started',
    })

    // Create the document
    const doc = await docsService.createDocument({
      title: typedArticle.title,
      content: typedArticle.content,
      description: typedArticle.description || undefined,
      tags: typedArticle.tags,
    })

    // Update article with Google Doc info
    const { error: updateError } = await supabase
      .from('articles')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      .update({
        google_doc_id: doc.docId,
        google_doc_url: doc.docUrl,
      })
      .eq('id', typedArticle.id)

    if (updateError) {
      throw new Error('Failed to update article with Google Doc info')
    }

    // Log success
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Supabase type inference issue with generation_logs
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      article_id: typedArticle.id,
      action: 'create_doc',
      status: 'success',
      metadata: { doc_id: doc.docId },
    })

    return NextResponse.json({
      success: true,
      message: 'Google Doc created successfully',
      docId: doc.docId,
      docUrl: doc.docUrl,
    })

  } catch (error) {
    console.error('Google Doc creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create Google Doc',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
