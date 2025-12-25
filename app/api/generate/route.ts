import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ArticleGeneratorService } from '@/lib/services/article-generator'
import { GoogleDocsService } from '@/lib/services/google-docs'
import { markdownToHtml } from '@/lib/utils/markdown'
// import { convertMermaidToImages } from '@/lib/utils/mermaid-converter'
import { z } from 'zod'

// Request validation schema
const generateRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  articleType: z.string().optional().default('technical'),
  wordCount: z.number().int().min(500).max(5000).optional().default(2000),
  platform: z.enum(['medium', 'devto', 'dzone', 'all']).optional().default('all'),
  aiProvider: z.enum(['claude', 'gemini']).optional().default('claude'),
  fileId: z.string().optional(),
  createGoogleDoc: z.boolean().optional().default(false),
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue with settings
      ? settings.anthropic_api_key
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue with settings
      : settings.google_ai_api_key

    if (!apiKey) {
      return NextResponse.json(
        { error: `${validatedData.aiProvider === 'claude' ? 'Claude' : 'Gemini'} API key not configured. Please add it in Settings.` },
        { status: 400 }
      )
    }

    // Get user profile for author signature
    // Also ensure profile exists (create if missing to prevent FK constraint errors)
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, bio, linkedin_handle, twitter_handle, github_handle, website')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it to prevent foreign key constraint errors
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found, creating one for user:', user.id)

      // Create profile
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null,
      })

      // Create user settings if they don't exist (should have been created already, but just in case)
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!existingSettings) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await supabase.from('user_settings').insert({
          user_id: user.id,
          default_ai_provider: 'claude',
          default_word_count: 2000,
        })
      }

      // Fetch the newly created profile
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('full_name, bio, linkedin_handle, twitter_handle, github_handle, website')
        .eq('id', user.id)
        .single()

      profile = newProfile
    }

    // Create a draft article record
    const { data: article, error: articleError } = await supabase
      .from('articles')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      .insert({
        user_id: user.id,
        title: validatedData.topic, // Temporary title
        content: '',
        platform: validatedData.platform,
        article_type: validatedData.articleType,
        status: 'draft',
        ai_provider: validatedData.aiProvider,
        file_id: validatedData.fileId || null,
      })
      .select()
      .single()

    if (articleError || !article) {
      console.error('Failed to create article record:', articleError)
      return NextResponse.json(
        {
          error: 'Failed to create article record',
          details: articleError?.message || 'Unknown error'
        },
        { status: 500 }
      )
    }

    const typedArticle = article as { id: string }

    // Log generation start
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Supabase type inference issue
    await supabase.from('generation_logs').insert({
      user_id: user.id,
      article_id: typedArticle.id,
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
        articleType: validatedData.articleType,
        wordCount: validatedData.wordCount,
        platform: validatedData.platform,
        provider: validatedData.aiProvider,
        apiKey,
        profile: profile || null,
      })

      // Convert Mermaid diagrams to WebP images
      // TODO: Mermaid requires browser environment - implement using Puppeteer for server-side rendering
      // const contentWithImages = await convertMermaidToImages(generatedArticle.content)

      const generationTime = Date.now() - startTime

      // Convert markdown to rich text HTML for storage
      const richTextHtml = markdownToHtml(generatedArticle.content)

      // Generate LinkedIn teaser for carousel articles
      let linkedinTeaser: string | null = null
      if (validatedData.articleType === 'carousel') {
        const teasers = [
          `Want to learn more about ${generatedArticle.title}? 📚`,
          `Curious about ${generatedArticle.title}? Swipe through! 👉`,
          `Master ${generatedArticle.title} in 5 slides! 💡`,
          `Everything you need to know about ${generatedArticle.title} 🚀`,
          `Quick guide to ${generatedArticle.title}! Save this for later 🔖`,
        ]
        linkedinTeaser = teasers[Math.floor(Math.random() * teasers.length)]
      }

      // Update article with generated content (store both markdown and rich text in database)
      const { error: updateError } = await supabase
        .from('articles')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase type inference issue
        .update({
          title: generatedArticle.title,
          content: generatedArticle.content,
          rich_text_content: richTextHtml,
          description: generatedArticle.description,
          tags: generatedArticle.tags,
          word_count: generatedArticle.wordCount,
          status: 'generated',
          generated_at: new Date().toISOString(),
          linkedin_teaser: linkedinTeaser,
          generation_metadata: generatedArticle.metadata,
        })
        .eq('id', typedArticle.id)

      if (updateError) {
        throw new Error('Failed to update article with generated content')
      }

      // Create Google Doc if requested
      let googleDocId: string | null = null
      let googleDocUrl: string | null = null

      if (validatedData.createGoogleDoc) {
        try {
          const docsService = await GoogleDocsService.createForUser(user.id)

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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - Supabase type inference issue
            .update({
              google_doc_id: googleDocId,
              google_doc_url: googleDocUrl,
            })
            .eq('id', typedArticle.id)

          // Log success
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Supabase type inference issue
          await supabase.from('generation_logs').insert({
            user_id: user.id,
            article_id: typedArticle.id,
            action: 'create_doc',
            status: 'success',
            metadata: { doc_id: googleDocId },
          })
        } catch (docError) {
          console.error('Failed to create Google Doc:', docError)
          // Log failure but don't fail the whole request
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Supabase type inference issue
          await supabase.from('generation_logs').insert({
            user_id: user.id,
            article_id: typedArticle.id,
            action: 'create_doc',
            status: 'failed',
            error_message: docError instanceof Error ? docError.message : 'Unknown error',
          })
        }
      }

      // Note: Markdown and rich text are now stored directly in the database
      // No need to upload to external storage
      // The markdown_url field is deprecated but kept for backward compatibility

      // Log final success
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      await supabase.from('generation_logs').insert({
        user_id: user.id,
        article_id: typedArticle.id,
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
          id: typedArticle.id,
          title: generatedArticle.title,
          description: generatedArticle.description,
          tags: generatedArticle.tags,
          word_count: generatedArticle.wordCount,
          google_doc_url: googleDocUrl,
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      await supabase.from('generation_logs').insert({
        user_id: user.id,
        article_id: typedArticle.id,
        action: 'generate',
        status: 'failed',
        ai_provider: validatedData.aiProvider,
        duration_ms: Date.now() - startTime,
        error_message: generationError instanceof Error ? generationError.message : 'Unknown error',
      })

      // Update article status to failed
      await supabase
        .from('articles')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase type inference issue
        .update({
          status: 'failed',
          error_message: generationError instanceof Error ? generationError.message : 'Unknown error',
        })
        .eq('id', typedArticle.id)

      throw generationError
    }

  } catch (error) {
    console.error('Article generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
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
