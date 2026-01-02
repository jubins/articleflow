// Article generation service with Claude and Gemini support
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Profile } from '@/lib/types/database'

export interface ArticleGenerationOptions {
  topic: string
  articleType?: string
  wordCount?: number
  platform: 'medium' | 'devto' | 'dzone' | 'all'
  provider: 'claude' | 'gemini'
  apiKey: string
  template?: string
  profile?: Partial<Profile> | null
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

// Article type templates
const ARTICLE_TYPE_TEMPLATES: Record<string, string> = {
  technical: `You are a technical content writer creating an in-depth technical article for {{platform}}.

Topic: {{topic}}

Requirements:
- Target word count: 2000-2500 words
- Write comprehensive technical content with deep-dive explanations
- Include 2-3 architecture diagrams using Mermaid syntax (system architecture, data flow, component relationships)
- Include 1-2 comparison tables for technologies, approaches, or features
- Include practical code examples with proper syntax
- Explain complex concepts clearly
- Structure with clear headings and subheadings
- Ensure technical accuracy

CRITICAL - Architecture Diagrams:
- Use ONLY basic Mermaid graph syntax wrapped in \`\`\`mermaid code blocks
- DO NOT use C4 diagrams, cloud/server/database/compute/auth keywords, or advanced Mermaid features
- Use only: graph TD, graph LR, flowchart, sequenceDiagram, or simple classDiagram
- Create diagrams showing system architecture, data flow, or component relationships
- Keep it simple and use standard graph syntax only

CRITICAL - Code Examples:
- Include real, working code examples
- Use proper language identifiers in code blocks
- Explain what the code does

Example Mermaid diagram (VALID SYNTAX ONLY):
\`\`\`mermaid
graph TD
    A[Client Application] -->|HTTP Request| B[API Gateway]
    B --> C{Authentication}
    C -->|Valid Token| D[Process Request]
    C -->|Invalid| E[Return 401]
    D --> F[(Database)]
    F -->|Data| D
    D -->|Response| A
\`\`\`

IMPORTANT: Only use basic Mermaid syntax. Do NOT use cloud, server, database, compute, or auth keywords.

CRITICAL - References Section:
- Include a "## References and Further Reading" section at the end of the article
- List 5-8 high-quality reference sources as simple hyperlinks
- Format as bullet points with just the title hyperlinked (no descriptions)
- Example format:
  ## References and Further Reading

  - [AWS Well-Architected Framework - Machine Learning Lens](https://aws.amazon.com/architecture/well-architected/)
  - [AWS Generative AI Lens Documentation](https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/welcome.html)
  - [AWS Sustainability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sustainability-pillar.html)

Generate a complete article in Markdown format with:
1. A compelling title
2. A brief description (150-200 characters for SEO)
3. 3-5 relevant tags
4. The full article content in Markdown (must include diagrams, tables, code examples, and references)

Format your response as JSON:
{
  "title": "Article Title Here",
  "description": "Brief description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full article content with References section..."
}`,

  tutorial: `You are a technical content writer creating a step-by-step tutorial for {{platform}}.

Topic: {{topic}}

Requirements:
- Target word count: 1500-2000 words
- Write clear, beginner-friendly step-by-step instructions
- Include prerequisites and setup section
- Include code snippets for each major step
- Include 1-2 workflow diagrams using Mermaid syntax
- Use numbered steps or clear section headings
- Include a "What you'll build" or "What you'll learn" section
- End with "Next steps" or "Conclusion"

CRITICAL - Step-by-Step Format:
- Number each major step clearly
- Provide code examples for each step
- Explain what each step accomplishes

CRITICAL - Workflow Diagrams:
- Use ONLY basic Mermaid graph syntax wrapped in \`\`\`mermaid code blocks
- DO NOT use C4 diagrams, cloud/server/database/compute/auth keywords, or advanced Mermaid features
- Use only: graph TD, graph LR, flowchart, sequenceDiagram, or simple classDiagram
- Keep it simple and use standard graph syntax only
- Show the tutorial workflow or process clearly

Example Mermaid diagram (VALID SYNTAX ONLY):
\`\`\`mermaid
graph TD
    A[Start] --> B[Install Dependencies]
    B --> C[Configure Project]
    C --> D[Write Code]
    D --> E[Test Application]
    E --> F[Deploy]
\`\`\`

IMPORTANT: Only use basic Mermaid syntax. Do NOT use cloud, server, database, compute, or auth keywords.

CRITICAL - References Section:
- Include a "## References" section at the end of the tutorial
- List 5-8 high-quality reference sources (documentation, tutorials, guides)
- Format as a numbered list with descriptive titles and context
- Example format:
  ## References

  1. **Official Documentation** - [Technology Name Official Docs](URL) - Comprehensive guide covering core concepts
  2. **Tutorial Series** - "Series Title" - Related tutorials for further learning

Generate a complete tutorial in Markdown format with:
1. A compelling title starting with "How to..." or "Getting Started with..."
2. A brief description (150-200 characters for SEO)
3. 3-5 relevant tags
4. The full tutorial content in Markdown (must include references)

Format your response as JSON:
{
  "title": "Tutorial Title Here",
  "description": "Brief description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full tutorial content with References section..."
}`,

  comparison: `You are a technical content writer creating a comparison article for {{platform}}.

Topic: {{topic}}

Requirements:
- Target word count: 1500-2000 words
- Compare multiple tools, frameworks, or approaches
- Include 2-3 detailed comparison tables
- Include pros and cons for each option
- Include use case recommendations
- Structure with clear sections for each option being compared
- Provide objective analysis with data/examples

CRITICAL - Comparison Tables:
- Use Markdown table syntax
- Compare features, performance, pricing, use cases, etc.
- Make tables comprehensive and informative

CRITICAL - Analysis:
- Provide objective comparisons
- Include specific examples or data
- Recommend which option for which use case

CRITICAL - References Section:
- Include a "## References" section at the end of the article
- List 5-8 high-quality reference sources (official docs, comparison studies, benchmarks)
- Format as a numbered list with descriptive titles and context
- Example format:
  ## References

  1. **Official Documentation** - [Technology Name Official Docs](URL) - Comprehensive guide covering core concepts
  2. **Benchmark Study** - "Study Title" - Performance comparison data

Generate a complete comparison article in Markdown format with:
1. A compelling title (e.g., "X vs Y: Which Should You Choose?")
2. A brief description (150-200 characters for SEO)
3. 3-5 relevant tags
4. The full article content in Markdown (must include comparison tables and references)

Format your response as JSON:
{
  "title": "Comparison Title Here",
  "description": "Brief description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full comparison content with References section..."
}`,

  'best-practices': `You are a technical content writer creating a best practices guide for {{platform}}.

Topic: {{topic}}

Requirements:
- Target word count: 1500-2000 words
- Provide industry-standard best practices and recommendations
- Include code examples showing good vs bad practices
- Include 1-2 tables summarizing do's and don'ts
- Explain WHY each practice is important
- Include common pitfalls to avoid
- Structure with clear sections for each best practice

CRITICAL - Code Examples:
- Show both good and bad examples
- Explain what makes the good example better
- Use proper code formatting

CRITICAL - Practical Guidance:
- Focus on actionable recommendations
- Explain the reasoning behind each practice
- Include real-world scenarios

CRITICAL - References Section:
- Include a "## References" section at the end of the article
- List 5-8 high-quality reference sources (style guides, official best practices, industry standards)
- Format as a numbered list with descriptive titles and context
- Example format:
  ## References

  1. **Official Style Guide** - [Technology Name Style Guide](URL) - Industry-standard best practices
  2. **Book** - "Book Title" by Author - Comprehensive guide to best practices

Generate a complete best practices article in Markdown format with:
1. A compelling title (e.g., "Best Practices for..." or "...Best Practices")
2. A brief description (150-200 characters for SEO)
3. 3-5 relevant tags
4. The full article content in Markdown (must include references)

Format your response as JSON:
{
  "title": "Best Practices Title Here",
  "description": "Brief description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full best practices content with References section..."
}`,

  'case-study': `You are a technical content writer creating a case study article for {{platform}}.

Topic: {{topic}}

Requirements:
- Target word count: 2000-2500 words
- Tell a real-world implementation story
- Include system architecture diagrams using Mermaid
- Include implementation details with code examples
- Include performance metrics, results, or outcomes
- Structure: Problem → Solution → Implementation → Results → Lessons Learned
- Make it engaging and narrative-driven

CRITICAL - Architecture Diagrams:
- Use ONLY basic Mermaid graph syntax wrapped in \`\`\`mermaid code blocks
- DO NOT use C4 diagrams, cloud/server/database/compute/auth keywords, or advanced Mermaid features
- Use only: graph TD, graph LR, flowchart, sequenceDiagram, or simple classDiagram
- Show the system architecture clearly
- Explain the architecture choices
- Keep it simple and use standard graph syntax only

Example Mermaid diagram (VALID SYNTAX ONLY):
\`\`\`mermaid
graph TD
    A[User Request] --> B[Load Balancer]
    B --> C[App Server 1]
    B --> D[App Server 2]
    C --> E[(Database)]
    D --> E
    E --> F[Cache Layer]
\`\`\`

IMPORTANT: Only use basic Mermaid syntax. Do NOT use cloud, server, database, compute, or auth keywords.

CRITICAL - Implementation Details:
- Include actual code snippets
- Explain technical decisions
- Show before/after comparisons if applicable

CRITICAL - Results & Metrics:
- Include concrete results (performance improvements, cost savings, etc.)
- Use tables for metrics comparison
- Include lessons learned

CRITICAL - References Section:
- Include a "## References" section at the end of the article
- List 5-8 high-quality reference sources (documentation, related case studies, research papers)
- Format as a numbered list with descriptive titles and context
- Example format:
  ## References

  1. **Official Documentation** - [Technology Name Official Docs](URL) - Technical reference used in implementation
  2. **Case Study** - "Related Case Study Title" - Similar implementation story

Generate a complete case study in Markdown format with:
1. A compelling title (e.g., "How We..." or "Building...")
2. A brief description (150-200 characters for SEO)
3. 3-5 relevant tags
4. The full case study content in Markdown (must include references)

Format your response as JSON:
{
  "title": "Case Study Title Here",
  "description": "Brief description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full case study content with References section..."
}`,

  carousel: `You are a technical content writer creating a LinkedIn carousel for {{platform}}.

Topic: {{topic}}

Requirements:
- Create EXACTLY between 4-10 engaging slides (randomly choose a number between 4 and 10 based on topic complexity)
- Start with basic concepts and progress to advanced insights
- Each slide should have a clear focus and key message
- Include Mermaid diagrams, comparison tables, or text-based content for slides
- Include at least 1-2 comparison tables when comparing features, approaches, or technologies
- End with enlightening insights or key takeaways
- Make it visually engaging and easy to follow

CRITICAL - Slide Count:
- Topic complexity determines slide count: simple topics (4-6 slides), complex topics (7-10 slides)
- Never create fewer than 4 or more than 10 slides
- Distribute content evenly across slides

CRITICAL - Slide Structure:
- Slide 1: Hook/Introduction - Grab attention with the problem or opportunity
- Slides 2-N-2: Core Content - Build understanding from basic to intermediate to advanced
- Slide N-1: Advanced Insights - Share deeper knowledge or best practices
- Slide N: Key Takeaways/CTA - Summarize and provide actionable next steps

CRITICAL - Mermaid Diagrams for Slides:
- Use ONLY basic Mermaid graph syntax wrapped in \`\`\`mermaid code blocks
- DO NOT use C4 diagrams, cloud/server/database/compute/auth keywords, or advanced Mermaid features
- Use only: graph TD, graph LR, flowchart, sequenceDiagram, or simple classDiagram
- Keep diagrams simple and focused on one concept per slide
- 2-4 slides should have diagrams showing concepts visually

Example Mermaid diagram for a slide (VALID SYNTAX ONLY):
\`\`\`mermaid
graph LR
    A[Problem] --> B[Solution]
    B --> C[Benefit]
\`\`\`

IMPORTANT: Only use basic Mermaid syntax. Do NOT use cloud, server, database, compute, or auth keywords.

CRITICAL - Comparison Tables:
- Include 1-2 markdown tables when comparing features, tools, approaches, or technologies
- Tables should be clean and concise (2-4 columns, 3-5 rows max)
- Use tables to show comparisons, feature matrices, or pros/cons
- Example table format:
| Feature | Option A | Option B |
|---------|----------|----------|
| Speed   | Fast     | Moderate |
| Cost    | High     | Low      |

CRITICAL - Content Guidelines:
- Each slide should be concise and focused (2-4 bullet points max for text slides)
- Use clear headings for each slide starting with "## Slide N:"
- Progressive difficulty: basic → intermediate → advanced
- Final slide should inspire action or deeper thinking
- Mix content types: some text slides, some diagram slides, some table slides

Generate a complete LinkedIn carousel in Markdown format with:
1. A compelling title for the carousel
2. A brief description (150-200 characters for SEO)
3. 3-5 relevant tags
4. The full carousel content in Markdown (4-10 slides with clear headings "## Slide N:")

Format your response as JSON:
{
  "title": "Carousel Title Here",
  "description": "Brief description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full carousel content with 4-10 slides..."
}`
}

const DEFAULT_TEMPLATE = ARTICLE_TYPE_TEMPLATES.technical

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
      model: 'claude-sonnet-4-5-20250929',
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

    // Note: Signature is now rendered in the UI, not appended to content
    // This allows signatures to update when profile changes without regenerating articles

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
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    const template = options.template || DEFAULT_TEMPLATE
    const prompt = this.fillTemplate(template, options)

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const generationTime = Date.now() - startTime

    // Parse the JSON response
    const article = this.parseArticleResponse(text)

    // Note: Signature is now rendered in the UI, not appended to content
    // This allows signatures to update when profile changes without regenerating articles

    return {
      ...article,
      metadata: {
        provider: 'gemini',
        model: 'gemini-3-flash-preview',
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
    // Use article type template if provided, otherwise use custom template or default
    const selectedTemplate = options.articleType
      ? ARTICLE_TYPE_TEMPLATES[options.articleType] || template
      : template

    return selectedTemplate
      .replace('{{topic}}', options.topic)
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
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        })
        return true
      } else {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
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
