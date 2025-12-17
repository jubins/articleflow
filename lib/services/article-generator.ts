// Article generation service with Claude and Gemini support
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ArticleGenerationOptions {
  topic: string
  prompt: string
  wordCount?: number
  platform: 'medium' | 'devto' | 'dzone' | 'all'
  provider: 'claude' | 'gemini'
  apiKey: string
  template?: string
}

export interface GeneratedArticle {
  title: string
  content: string
  description: string
  tags: string[]
  wordCount: number
  metadata: {
    provider: string
    model: string
    tokensUsed?: number
    generationTime: number
  }
}

const DEFAULT_TEMPLATE = `You are a technical content writer creating high-quality articles for publication on {{platform}}.

Topic: {{topic}}

User Instructions: {{prompt}}

Requirements:
- Target word count: {{wordCount}} words
- Write in a clear, engaging, and professional tone
- Include practical examples and code snippets where relevant
- Structure the article with clear headings and subheadings
- Ensure technical accuracy
- Make it valuable for developers and technical readers

Generate a complete article in Markdown format with:
1. A compelling title
2. A brief description (150-200 characters for SEO)
3. 3-5 relevant tags
4. The full article content in Markdown

Format your response as JSON:
{
  "title": "Article Title Here",
  "description": "Brief description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full article content in Markdown format..."
}

Make sure the content is well-structured, engaging, and ready to publish.`

export class ArticleGeneratorService {
  /**
   * Generate an article using the specified AI provider
   */
  static async generateArticle(
    options: ArticleGenerationOptions
  ): Promise<GeneratedArticle> {
    const startTime = Date.now()

    try {
      if (options.provider === 'claude') {
        return await this.generateWithClaude(options, startTime)
      } else {
        return await this.generateWithGemini(options, startTime)
      }
    } catch (error) {
      console.error('Article generation error:', error)
      throw new Error(
        `Failed to generate article: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generate article using Claude API
   */
  private static async generateWithClaude(
    options: ArticleGenerationOptions,
    startTime: number
  ): Promise<GeneratedArticle> {
    const anthropic = new Anthropic({
      apiKey: options.apiKey,
    })

    const template = options.template || DEFAULT_TEMPLATE
    const prompt = this.fillTemplate(template, options)

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const generationTime = Date.now() - startTime

    // Extract the text content from Claude's response
    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('')

    // Parse the JSON response
    const article = this.parseArticleResponse(textContent)

    return {
      ...article,
      metadata: {
        provider: 'claude',
        model: response.model,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        generationTime,
      },
    }
  }

  /**
   * Generate article using Gemini API
   */
  private static async generateWithGemini(
    options: ArticleGenerationOptions,
    startTime: number
  ): Promise<GeneratedArticle> {
    const genAI = new GoogleGenerativeAI(options.apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const template = options.template || DEFAULT_TEMPLATE
    const prompt = this.fillTemplate(template, options)

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const generationTime = Date.now() - startTime

    // Parse the JSON response
    const article = this.parseArticleResponse(text)

    return {
      ...article,
      metadata: {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        tokensUsed: response.usageMetadata?.totalTokenCount,
        generationTime,
      },
    }
  }

  /**
   * Fill template with actual values
   */
  private static fillTemplate(
    template: string,
    options: ArticleGenerationOptions
  ): string {
    return template
      .replace('{{topic}}', options.topic)
      .replace('{{prompt}}', options.prompt)
      .replace('{{wordCount}}', (options.wordCount || 2000).toString())
      .replace('{{platform}}', this.getPlatformName(options.platform))
  }

  /**
   * Get human-readable platform name
   */
  private static getPlatformName(platform: string): string {
    const platformNames: Record<string, string> = {
      medium: 'Medium',
      devto: 'Dev.to',
      dzone: 'DZone',
      all: 'multiple platforms (Medium, Dev.to, and DZone)',
    }
    return platformNames[platform] || platform
  }

  /**
   * Parse the AI response and extract article data
   */
  private static parseArticleResponse(text: string): Omit<GeneratedArticle, 'metadata'> {
    try {
      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate required fields
      if (!parsed.title || !parsed.content) {
        throw new Error('Missing required fields: title and content')
      }

      // Count words in content
      const wordCount = parsed.content.split(/\s+/).filter(Boolean).length

      return {
        title: parsed.title,
        content: parsed.content,
        description: parsed.description || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        wordCount,
      }
    } catch (error) {
      console.error('Failed to parse article response:', error)
      console.error('Response text:', text)
      throw new Error(
        `Failed to parse article response: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Validate API key for a provider
   */
  static async validateApiKey(
    provider: 'claude' | 'gemini',
    apiKey: string
  ): Promise<boolean> {
    try {
      if (provider === 'claude') {
        const anthropic = new Anthropic({ apiKey })
        // Try a minimal API call to validate
        await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        })
        return true
      } else {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
        // Try a minimal generation to validate
        await model.generateContent('Hi')
        return true
      }
    } catch (error) {
      console.error('API key validation error:', error)
      return false
    }
  }
}
