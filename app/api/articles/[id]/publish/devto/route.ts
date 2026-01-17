import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishToDevTo } from '@/lib/services/devto-publisher'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const articleId = params.id

    // Get article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedArticle = article as any

    if (articleError || !typedArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if already published to Dev.to
    const { data: existingPublication } = await supabase
      .from('article_publications')
      .select('*')
      .eq('article_id', articleId)
      .eq('platform', 'devto')
      .single()

    if (existingPublication) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedPub = existingPublication as any
      return NextResponse.json(
        {
          error: 'Article already published to Dev.to',
          published_url: typedPub.published_url,
        },
        { status: 409 }
      )
    }

    // Get Dev.to API key from user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('devto_api_key')
      .eq('user_id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSettings = settings as any
    if (settingsError || !typedSettings?.devto_api_key) {
      return NextResponse.json(
        { error: 'Dev.to API key not configured. Please add it in Publishing settings.' },
        { status: 400 }
      )
    }

    // Get user profile for author signature
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, bio, linkedin_handle, twitter_handle, github_handle, website')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedProfile = profile as any

    // Build author signature
    let authorSignature = ''
    if (typedProfile) {
      authorSignature += '## About the Author\n\n'

      if (typedProfile.full_name) {
        authorSignature += `Written by **${typedProfile.full_name}**\n\n`
      }

      if (typedProfile.bio) {
        authorSignature += `${typedProfile.bio}\n\n`
      }

      const socialLinks = []
      if (typedProfile.linkedin_handle) {
        socialLinks.push(`[LinkedIn](https://linkedin.com/in/${typedProfile.linkedin_handle.replace(/^@/, '')})`)
      }
      if (typedProfile.twitter_handle) {
        socialLinks.push(`[Twitter/X](https://twitter.com/${typedProfile.twitter_handle.replace(/^@/, '')})`)
      }
      if (typedProfile.github_handle) {
        socialLinks.push(`[GitHub](https://github.com/${typedProfile.github_handle.replace(/^@/, '')})`)
      }
      if (typedProfile.website) {
        socialLinks.push(`[Website](${typedProfile.website})`)
      }

      if (socialLinks.length > 0) {
        authorSignature += `Connect with me: ${socialLinks.join(' | ')}`
      }
    }

    // Publish to Dev.to
    const result = await publishToDevTo({
      apiKey: typedSettings.devto_api_key,
      article: typedArticle,
      authorSignature,
      publishAsLive: false, // Always publish as draft
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Save publication record
    const { error: publicationError } = await supabase
      .from('article_publications')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      .insert({
        article_id: articleId,
        user_id: user.id,
        platform: 'devto',
        published_url: result.articleUrl!,
        platform_article_id: result.articleId?.toString(),
        metadata: {
          published_as_draft: true,
          tags: typedArticle.tags.slice(0, 4),
        },
      })

    if (publicationError) {
      console.error('Failed to save publication record:', publicationError)
      // Don't fail the request, article was published successfully
    }

    return NextResponse.json({
      success: true,
      published_url: result.articleUrl,
      article_id: result.articleId,
      message: 'Article published to Dev.to as draft',
    })
  } catch (error) {
    console.error('Publish to Dev.to error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to publish article',
      },
      { status: 500 }
    )
  }
}
