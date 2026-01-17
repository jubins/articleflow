/**
 * Dev.to Publishing Service
 * Handles publishing articles to Dev.to platform
 */

import { Article } from '@/lib/types/database'

export interface DevToPublishOptions {
  apiKey: string
  article: Article
  authorSignature?: string
  publishAsLive?: boolean // Default: false (publish as draft)
}

export interface DevToPublishResult {
  success: boolean
  articleUrl?: string
  articleId?: number
  error?: string
}

/**
 * Formats tags for Dev.to (max 4 tags, lowercase, no special chars)
 */
function formatTagsForDevTo(tags: string[]): string[] {
  return tags
    .slice(0, 4) // Dev.to allows max 4 tags
    .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(tag => tag.length > 0)
}

/**
 * Extracts the first image URL from markdown content
 */
function extractCoverImage(content: string): string | null {
  // Match markdown image syntax: ![alt](url)
  const imageMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/)
  if (imageMatch && imageMatch[1]) {
    return imageMatch[1]
  }

  // Match HTML img tags: <img src="url">
  const htmlImageMatch = content.match(/<img[^>]+src=["']([^"']+)["']/)
  if (htmlImageMatch && htmlImageMatch[1]) {
    return htmlImageMatch[1]
  }

  return null
}

/**
 * Appends author signature to article content
 */
function appendAuthorSignature(content: string, signature?: string): string {
  if (!signature) return content

  return `${content}\n\n---\n\n${signature}`
}

/**
 * Publishes an article to Dev.to
 */
export async function publishToDevTo(options: DevToPublishOptions): Promise<DevToPublishResult> {
  const { apiKey, article, authorSignature, publishAsLive = false } = options

  try {
    // Prepare article content with author signature
    const finalContent = appendAuthorSignature(article.content, authorSignature)

    // Format tags
    const formattedTags = formatTagsForDevTo(article.tags)

    // Extract cover image if available
    const coverImage = extractCoverImage(article.content)

    // Prepare Dev.to article payload
    const devtoPayload = {
      article: {
        title: article.title,
        published: publishAsLive, // false = draft, true = published
        body_markdown: finalContent,
        tags: formattedTags,
        ...(article.description && { description: article.description }),
        ...(coverImage && { main_image: coverImage }),
      },
    }

    // Make API request to Dev.to
    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(devtoPayload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || errorData.message || `Dev.to API error: ${response.status} ${response.statusText}`
      )
    }

    const result = await response.json()

    // For drafts, Dev.to returns a public URL that shows 404
    // We need to construct the edit/dashboard URL instead
    let articleUrl = result.url
    if (!publishAsLive && result.id) {
      // Use the dashboard edit URL for drafts
      articleUrl = `https://dev.to/dashboard/posts/${result.id}/edit`
    }

    return {
      success: true,
      articleUrl,
      articleId: result.id,
    }
  } catch (error) {
    console.error('Dev.to publishing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish to Dev.to',
    }
  }
}

/**
 * Validates a Dev.to API key by fetching user information
 */
export async function validateDevToApiKey(apiKey: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const response = await fetch('https://dev.to/api/users/me', {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        valid: false,
        error: 'Invalid API key',
      }
    }

    const userData = await response.json()

    return {
      valid: true,
      username: userData.username,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate API key',
    }
  }
}
