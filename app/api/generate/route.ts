import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ArticleGeneratorService } from '@/lib/services/article-generator'
import { GoogleDocsService } from '@/lib/services/google-docs'
import { StorageService } from '@/lib/services/storage'
import { z } from 'zod'

// Request validation schema
const generateRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  wordCount: z.number().int().min(500).max(5000).optional().default(2000),
  platform: z.enum(['medium', 'devto', 'dzone', 'all']),
  aiProvider: z.enum(['claude', 'gemini']).optional().default('claude'),
  fileId: z.string().optional(),
  promptId: z.string().uuid().optional(),
  createGoogleDoc: z.boolean().optional().default(true),
  uploadMarkdown: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = generateRequestSchema.parse(body)

    // Get user settings for API keys
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'User settings not found. Please configure your API keys in Settings.' },
        { status: 400 }
      )
    }

    // Get the appropriate API key based on provider
    const apiKey = validatedData.aiProvider === 'claude'
      ? settings.anthropic_api_key
      : settings.google_ai_api_key

    if (!apiKey) {
      return NextResponse.json(
        { error: `${validatedData.aiProvider === 'claude' ? 'Claude' : 'Gemini'} API key not configured. Please add it in Settings.` },
        { status: 400 }
      )
    }

    // Create a draft article record
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert({
        user_id: user.id,
        prompt_id: validatedData.promptId || null,
        title: validatedData.topic, // Temporary title
        content: '',
        platform: validatedData.platform,
        status: 'draft',
        ai_provider: validatedData.aiProvider,
        file_id: validatedData.fileId || null,
      })
      .select()
      .single()

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Failed to create article record' },
        { status: 500 }
      )
    }

    // Log generation start
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      article_id: article.id,
      action: 'generate',
      status: 'started',
      ai_provider: validatedData.aiProvider,
      metadata: {
        topic: validatedData.topic,
        word_count: validatedData.wordCount,
        platform: validatedData.platform,
      },
    })

    try {
      // Generate article using AI
      const generatedArticle = await ArticleGeneratorService.generateArticle({
        topic: validatedData.topic,
        prompt: validatedData.prompt,
        wordCount: validatedData.wordCount,
        platform: validatedData.platform,
        provider: validatedData.aiProvider,
        apiKey,
        template: settings.article_template || undefined,
      })

      const generationTime = Date.now() - startTime

      // Update article with generated content
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title: generatedArticle.title,
          content: generatedArticle.content,
          description: generatedArticle.description,
          tags: generatedArticle.tags,
          word_count: generatedArticle.wordCount,
          status: 'generated',
          generated_at: new Date().toISOString(),
          generation_metadata: generatedArticle.metadata,
        })
        .eq('id', article.id)

      if (updateError) {
        throw new Error('Failed to update article with generated content')
      }

      // Create Google Doc if requested
      let googleDocId: string | null = null
      let googleDocUrl: string | null = null

      if (validatedData.createGoogleDoc) {
        try {
          const docsService = new GoogleDocsService({
            clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
            privateKey: process.env.GOOGLE_PRIVATE_KEY!,
            projectId: process.env.GOOGLE_PROJECT_ID!,
          })

          const doc = await docsService.createDocument({
            title: generatedArticle.title,
            content: generatedArticle.content,
            description: generatedArticle.description,
            tags: generatedArticle.tags,
          })

          googleDocId = doc.docId
          googleDocUrl = doc.docUrl

          // Update article with Google Doc info
          await supabase
            .from('articles')
            .update({
              google_doc_id: googleDocId,
              google_doc_url: googleDocUrl,
            })
            .eq('id', article.id)

          // Log success
          await supabase.from('generation_logs').insert({
            user_id: user.id,
            article_id: article.id,
            action: 'create_doc',
            status: 'success',
            metadata: { doc_id: googleDocId },
          })
        } catch (docError) {
          console.error('Failed to create Google Doc:', docError)
          // Log failure but don't fail the whole request
          await supabase.from('generation_logs').insert({
            user_id: user.id,
            article_id: article.id,
            action: 'create_doc',
            status: 'failed',
            error_message: docError instanceof Error ? docError.message : 'Unknown error',
          })
        }
      }

      // Upload markdown if requested
      let markdownUrl: string | null = null

      if (validatedData.uploadMarkdown) {
        try {
          const storageService = new StorageService()
          const fileId = validatedData.fileId || article.id

          const upload = await storageService.uploadMarkdown({
            userId: user.id,
            fileId,
            content: generatedArticle.content,
            fileName: `${fileId}.md`,
          })

          markdownUrl = upload.url

          // Update article with markdown URL
          await supabase
            .from('articles')
            .update({
              markdown_url: markdownUrl,
            })
            .eq('id', article.id)

          // Log success
          await supabase.from('generation_logs').insert({
            user_id: user.id,
            article_id: article.id,
            action: 'upload_markdown',
            status: 'success',
            metadata: { markdown_url: markdownUrl },
          })
        } catch (uploadError) {
          console.error('Failed to upload markdown:', uploadError)
          // Log failure but don't fail the whole request
          await supabase.from('generation_logs').insert({
            user_id: user.id,
            article_id: article.id,
            action: 'upload_markdown',
            status: 'failed',
            error_message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          })
        }
      }

      // Mark prompt as processed if provided
      if (validatedData.promptId) {
        await supabase
          .from('prompts')
          .update({ processed: true })
          .eq('id', validatedData.promptId)
      }

      // Log final success
      await supabase.from('generation_logs').insert({
        user_id: user.id,
        article_id: article.id,
        action: 'generate',
        status: 'success',
        ai_provider: validatedData.aiProvider,
        duration_ms: generationTime,
        metadata: {
          word_count: generatedArticle.wordCount,
          tokens_used: generatedArticle.metadata.tokensUsed,
        },
      })

      // Return success response
      return NextResponse.json({
        success: true,
        article: {
          id: article.id,
          title: generatedArticle.title,
          description: generatedArticle.description,
          tags: generatedArticle.tags,
          word_count: generatedArticle.wordCount,
          google_doc_url: googleDocUrl,
          markdown_url: markdownUrl,
          platform: validatedData.platform,
          ai_provider: validatedData.aiProvider,
        },
        metadata: {
          generation_time_ms: generationTime,
          ...generatedArticle.metadata,
        },
      })

    } catch (generationError) {
      // Log failure
      await supabase.from('generation_logs').insert({
        user_id: user.id,
        article_id: article.id,
        action: 'generate',
        status: 'failed',
        ai_provider: validatedData.aiProvider,
        duration_ms: Date.now() - startTime,
        error_message: generationError instanceof Error ? generationError.message : 'Unknown error',
      })

      // Update article status to failed
      await supabase
        .from('articles')
        .update({
          status: 'failed',
          error_message: generationError instanceof Error ? generationError.message : 'Unknown error',
        })
        .eq('id', article.id)

      throw generationError
    }

  } catch (error) {
    console.error('Article generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to generate article',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
