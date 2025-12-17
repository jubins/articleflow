import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleDocsService } from '@/lib/services/google-docs'
import { z } from 'zod'

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

    // Check if Google Doc already exists
    if (article.google_doc_id) {
      return NextResponse.json(
        {
          success: true,
          message: 'Google Doc already exists',
          docId: article.google_doc_id,
          docUrl: article.google_doc_url,
        }
      )
    }

    // Create Google Docs service
    const docsService = new GoogleDocsService({
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
      privateKey: process.env.GOOGLE_PRIVATE_KEY!,
      projectId: process.env.GOOGLE_PROJECT_ID!,
    })

    // Log start
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      article_id: article.id,
      action: 'create_doc',
      status: 'started',
    })

    // Create the document
    const doc = await docsService.createDocument({
      title: article.title,
      content: article.content,
      description: article.description || undefined,
      tags: article.tags,
    })

    // Update article with Google Doc info
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        google_doc_id: doc.docId,
        google_doc_url: doc.docUrl,
      })
      .eq('id', article.id)

    if (updateError) {
      throw new Error('Failed to update article with Google Doc info')
    }

    // Log success
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      article_id: article.id,
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
        { error: 'Validation error', details: error.errors },
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
