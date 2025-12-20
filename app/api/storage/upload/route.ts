import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StorageService } from '@/lib/services/storage'
import { Article } from '@/lib/types/database'
import { z } from 'zod'

// Request validation schema
const uploadRequestSchema = z.object({
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
    const validatedData = uploadRequestSchema.parse(body)

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

    // Check if markdown already uploaded
    if (typedArticle.markdown_url) {
      return NextResponse.json(
        {
          success: true,
          message: 'Markdown file already uploaded',
          url: typedArticle.markdown_url,
        }
      )
    }

    // Create storage service
    const storageService = new StorageService()

    // Log start
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Supabase type inference issue
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      article_id: typedArticle.id,
      action: 'upload_markdown',
      status: 'started',
    })

    // Upload markdown
    const fileId = typedArticle.file_id || typedArticle.id
    const upload = await storageService.uploadMarkdown({
      userId: user.id,
      fileId,
      content: typedArticle.content,
      fileName: `${fileId}.md`,
    })

    // Update article with markdown URL
    const { error: updateError } = await supabase
      .from('articles')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      .update({
        markdown_url: upload.url,
      })
      .eq('id', typedArticle.id)

    if (updateError) {
      throw new Error('Failed to update article with markdown URL')
    }

    // Log success
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Supabase type inference issue
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      article_id: typedArticle.id,
      action: 'upload_markdown',
      status: 'success',
      metadata: { markdown_url: upload.url },
    })

    return NextResponse.json({
      success: true,
      message: 'Markdown uploaded successfully',
      url: upload.url,
      path: upload.path,
    })

  } catch (error) {
    console.error('Markdown upload error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to upload markdown',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to download markdown
export async function GET(request: NextRequest) {
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

    // Get article ID from query params
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID required' },
        { status: 400 }
      )
    }

    // Get the article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const typedArticle = article as Article

    // Return the markdown content directly
    return new NextResponse(typedArticle.content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${typedArticle.file_id || typedArticle.id}.md"`,
      },
    })

  } catch (error) {
    console.error('Markdown download error:', error)

    return NextResponse.json(
      {
        error: 'Failed to download markdown',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
