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
  tldr: string
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
- End the article with a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should be authoritative sources: official documentation, technical papers, reputable blogs, books
- Format each reference as a simple hyperlinked text WITHOUT any description after it
- Example format:
  - [AWS SageMaker HyperPod Official Documentation](URL)
  - [Scaling Laws for Neural Language Models](URL)
- DO NOT add any text or description after the hyperlink

Generate a complete article in Markdown format with:
1. A compelling title
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags
5. The full article content in Markdown (must include diagrams, tables, code examples, and references section)

Format your response as JSON:
{
  "title": "Article Title Here",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full article content..."
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
- End the tutorial with a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should be authoritative sources: official documentation, technical papers, reputable blogs, books
- Format each reference with a brief description of what it covers
- Example format:
  - [Official Documentation Name](URL) - Brief description of the resource
  - Author Name's Book/Article Title - Description of what readers will learn

Generate a complete tutorial in Markdown format with:
1. A compelling title starting with "How to..." or "Getting Started with..."
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags
5. The full tutorial content in Markdown (must include references section)

Format your response as JSON:
{
  "title": "Tutorial Title Here",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full tutorial content..."
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
- End the article with a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should be authoritative sources: official documentation, technical papers, reputable blogs, books
- Format each reference as a simple hyperlinked text WITHOUT any description after it
- Example format:
  - [AWS SageMaker HyperPod Official Documentation](URL)
  - [Scaling Laws for Neural Language Models](URL)
- DO NOT add any text or description after the hyperlink

Generate a complete comparison article in Markdown format with:
1. A compelling title (e.g., "X vs Y: Which Should You Choose?")
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags
5. The full article content in Markdown (must include comparison tables and references section)

Format your response as JSON:
{
  "title": "Comparison Title Here",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full comparison content..."
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
- End the article with a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should be authoritative sources: official documentation, technical papers, reputable blogs, books
- Format each reference as a simple hyperlinked text WITHOUT any description after it
- Example format:
  - [AWS SageMaker HyperPod Official Documentation](URL)
  - [Scaling Laws for Neural Language Models](URL)
- DO NOT add any text or description after the hyperlink

Generate a complete best practices article in Markdown format with:
1. A compelling title (e.g., "Best Practices for..." or "...Best Practices")
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags
5. The full article content in Markdown (must include references section)

Format your response as JSON:
{
  "title": "Best Practices Title Here",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full best practices content..."
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
- End the article with a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should be authoritative sources: official documentation, technical papers, reputable blogs, books
- Format each reference as a simple hyperlinked text WITHOUT any description after it
- Example format:
  - [AWS SageMaker HyperPod Official Documentation](URL)
  - [Scaling Laws for Neural Language Models](URL)
- DO NOT add any text or description after the hyperlink

Generate a complete case study in Markdown format with:
1. A compelling title (e.g., "How We..." or "Building...")
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags
5. The full case study content in Markdown (must include references section)

Format your response as JSON:
{
  "title": "Case Study Title Here",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full case study content..."
}`,

  'systems-design': `You are a senior systems design expert creating an interview-focused systems design article for {{platform}}.

Topic: {{topic}}

Requirements:
- Create a complete systems design framework article following the interview approach
- Target word count: 2500-3000 words
- Follow the logical order used in real systems design interviews
- Include HIGH-LEVEL DESIGN (HLD) diagrams showing complete system architecture
- Include detailed API/endpoint definitions
- Include scale estimation calculations
- Include data models and storage design
- Include component-level design details
- Address scaling, reliability, fault tolerance, security, and trade-offs

CRITICAL - Interview Framework Structure (follow this exact order):
1. **Requirements Clarification** (~300 words)
   - Functional requirements (what the system must do)
   - Non-functional requirements (scalability, availability, latency, consistency)
   - Constraints and assumptions (budget, timeline, team size, existing infrastructure)

2. **API / Endpoint Definitions** (~200 words)
   - Define REST or GraphQL APIs with request/response examples
   - Include HTTP methods, paths, request bodies, and response formats
   - Example:
     POST /api/posts
     Request: { "title": "...", "content": "...", "userId": "..." }
     Response: { "postId": "...", "status": "published", "timestamp": "..." }

3. **Scale & Traffic Estimation** (~250 words)
   - DAU (Daily Active Users) assumptions
   - Requests per second (RPS) calculations
   - Storage requirements estimation
   - Bandwidth calculations
   - Example calculation format with math shown step-by-step

4. **High-Level Architecture** (~400 words)
   - Create 1-2 HIGH-LEVEL DESIGN (HLD) Mermaid diagrams showing complete system architecture
   - Show all major components: clients, load balancers, API gateways, services, databases, caches, message queues, CDN
   - Show data flow between components
   - Label connections with protocols and data types

5. **Data Models & Storage Design** (~300 words)
   - Define database schemas (SQL or NoSQL)
   - Include tables/collections with columns/fields and data types
   - Explain choice of database (SQL vs NoSQL, why?)
   - Include indexing strategies
   - Show data relationships with simple ER diagrams if needed

6. **Component-Level Design** (~400 words)
   - Deep dive into 2-3 critical components
   - Explain internal workflows and algorithms
   - Include sequence diagrams showing interactions between components
   - Code-level pseudocode for complex logic if applicable

7. **Scaling & Bottlenecks** (~300 words)
   - Identify potential bottlenecks (database, single points of failure, network, etc.)
   - Propose scaling strategies: horizontal scaling, sharding, replication, caching
   - Include cache strategies (what to cache, TTL, cache invalidation)
   - Message queues for async processing

8. **Reliability & Fault Tolerance** (~200 words)
   - Load balancing strategies
   - Replication and backups
   - Health checks and monitoring
   - Circuit breakers and retry mechanisms
   - Disaster recovery plans

9. **Security & Compliance** (~150 words)
   - Authentication and authorization (OAuth, JWT, API keys)
   - Data encryption (in transit and at rest)
   - Rate limiting and DDoS protection
   - GDPR/privacy compliance if applicable

10. **Trade-offs & Summary** (~200 words)
    - Discuss architectural trade-offs made (CAP theorem, consistency vs availability)
    - Alternative approaches considered
    - Why this design is optimal for the requirements
    - Key takeaways and final thoughts

CRITICAL - High-Level Design Diagrams:
- Use ONLY basic Mermaid graph syntax wrapped in \`\`\`mermaid code blocks
- Create comprehensive architecture diagrams showing the COMPLETE system
- Include: Load Balancer, API Gateway, Application Servers, Databases, Caches (Redis/Memcached), Message Queues, CDN
- DO NOT use C4 diagrams, cloud/server/database/compute/auth keywords, or advanced Mermaid features
- Use only: graph TD, graph LR, flowchart, or sequenceDiagram
- Label all connections with what data flows through them

Example HLD Mermaid diagram (VALID SYNTAX ONLY):
\`\`\`mermaid
graph TD
    Client[Web/Mobile Client] -->|HTTPS| CDN[CDN]
    CDN -->|Static Assets| Client
    Client -->|API Requests| LB[Load Balancer]
    LB --> API1[API Server 1]
    LB --> API2[API Server 2]
    API1 --> Cache[(Redis Cache)]
    API2 --> Cache
    API1 --> Queue[Message Queue]
    API2 --> Queue
    Queue --> Worker[Background Workers]
    API1 --> DB[(Primary Database)]
    API2 --> DB
    DB --> Replica[(Read Replica)]
    Worker --> DB
    Worker --> Storage[Object Storage]
\`\`\`

IMPORTANT: Only use basic Mermaid syntax. Do NOT use cloud, server, database, compute, or auth keywords.

CRITICAL - References Section:
- End the article with a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should be authoritative sources: system design books, papers, blogs (e.g., "Designing Data-Intensive Applications", "System Design Primer")
- Format each reference as a simple hyperlinked text WITHOUT any description after it
- Example format:
  - [Designing Data-Intensive Applications by Martin Kleppmann](URL)
  - [System Design Primer GitHub Repository](URL)
- DO NOT add any text or description after the hyperlink

Generate a complete systems design article in Markdown format with:
1. A compelling title (e.g., "System Design: Building a Scalable URL Shortener")
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags (e.g., ["system-design", "architecture", "scalability", "interviews"])
5. The full article content following the 10-step interview framework in Markdown (must include HLD diagrams, API definitions, calculations, and references section)

Format your response as JSON:
{
  "title": "System Design: [Topic]",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
  "tags": ["system-design", "architecture", "tag3", "tag4"],
  "content": "Full systems design article..."
}`,

  'career-tips': `You are a senior engineering leader and career coach creating a career advancement article for {{platform}}.

Topic: {{topic}}

Requirements:
- Create actionable career advice for technical professionals
- Target word count: 1800-2200 words
- Focus on career progression from Mid-level to Senior, Staff, Principal, or management tracks
- Include VISUAL DIAGRAMS showing career frameworks, progression paths, or decision-making models
- Include comparison tables for different roles, levels, or tracks
- Provide real-world scenarios and decision-making guidance
- Make it applicable and actionable

CRITICAL - Content Structure:
1. **Introduction & Context** (~200 words)
   - Set the stage: why this career topic matters
   - What level/role is this advice for?
   - What problem or opportunity does it address?

2. **Core Framework or Strategy** (~400 words)
   - Present the main career framework, model, or strategy
   - Use a Mermaid diagram to visualize the framework
   - Break down into clear, actionable components
   - Explain the "why" behind each component

3. **Level-by-Level Breakdown** (~600 words)
   - Detail expectations for different levels (Senior, Staff, Principal, etc.)
   - Include a comparison table showing:
     - Skills required at each level
     - Impact scope and ownership
     - Communication and collaboration expectations
     - Technical vs leadership balance
   - Make it specific and concrete with examples

4. **Real-World Scenarios** (~300 words)
   - Provide 2-3 realistic scenarios or case studies
   - Show decision-making processes
   - Explain what success looks like at each level
   - Include common pitfalls to avoid

5. **Actionable Steps & Takeaways** (~300 words)
   - Concrete steps readers can take TODAY
   - How to assess where you are now
   - How to create a development plan
   - Resources for continued growth

CRITICAL - Mermaid Diagrams for Career Frameworks:
- Use ONLY basic Mermaid syntax wrapped in \`\`\`mermaid code blocks
- Use diagrams to show:
  - Career progression paths (IC vs Manager tracks)
  - Decision-making frameworks (quadrants, flowcharts)
  - Skills/competency models
  - Timeline or user journey diagrams showing career progression
  - Kanban boards for personal development
- DO NOT use C4 diagrams, cloud/server/database/compute/auth keywords, or advanced Mermaid features
- Supported diagram types: graph TD, graph LR, flowchart, pie, timeline, journey, quadrantChart, gitGraph, gantt
- Create 2-3 visual diagrams to make concepts clear

Example Career Path Diagram (VALID SYNTAX ONLY):
\`\`\`mermaid
graph TD
    A[Mid-Level Engineer] --> B{Career Choice}
    B -->|IC Track| C[Senior Engineer]
    C --> D[Staff Engineer]
    D --> E[Principal Engineer]
    B -->|Management Track| F[Engineering Manager]
    F --> G[Senior EM]
    G --> H[Director]
\`\`\`

Example Quadrant Chart (Skills vs Impact):
\`\`\`mermaid
quadrantChart
    title Skills vs Impact by Level
    x-axis Low Technical Skill --> High Technical Skill
    y-axis Low Impact --> High Impact
    quadrant-1 Principal/Staff
    quadrant-2 Senior Manager
    quadrant-3 Junior
    quadrant-4 Senior IC
    Mid: [0.3, 0.3]
    Senior: [0.6, 0.5]
    Staff: [0.8, 0.8]
    Principal: [0.9, 0.9]
\`\`\`

Example User Journey (Career Progression):
\`\`\`mermaid
journey
    title Career Growth Journey
    section Year 1-2
      Learn fundamentals: 3: IC
      Ship features: 4: IC
      Get mentorship: 4: IC
    section Year 3-4
      Lead projects: 5: IC
      Mentor others: 4: IC
      Drive technical decisions: 5: IC
    section Year 5+
      Influence org strategy: 5: IC
      Set technical direction: 5: IC
      Grow other leaders: 5: IC
\`\`\`

IMPORTANT: Only use basic Mermaid syntax. Charts should clearly illustrate career frameworks.

CRITICAL - Comparison Tables:
- Include 1-2 markdown tables comparing:
  - IC (Individual Contributor) vs Manager tracks
  - Role expectations across levels (Senior, Staff, Principal)
  - Skills matrix (technical, communication, leadership)
  - Impact and scope at each level
- Tables should be clear and scannable (3-5 columns, 4-6 rows max)

Example Level Comparison Table:
| Level | Technical Depth | Scope of Impact | Leadership | Autonomy |
|-------|----------------|-----------------|------------|----------|
| Senior | Expert in 1-2 areas | Team | Mentors 1-2 | High |
| Staff | Expert in multiple areas | Multiple teams | Leads initiatives | Very High |
| Principal | Industry expert | Org-wide | Shapes culture | Autonomous |

CRITICAL - Actionable Advice:
- Provide specific, concrete actions readers can take
- Include self-assessment questions
- Suggest resources, books, communities
- Make it practical and immediately applicable
- Avoid vague platitudes; be specific

CRITICAL - References Section:
- End the article with a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should include: career development books, blogs, frameworks (e.g., "Staff Engineer" by Will Larson, "The Manager's Path")
- Format each reference as a simple hyperlinked text WITHOUT any description after it
- Example format:
  - [Staff Engineer: Leadership Beyond the Management Track](URL)
  - [The Manager's Path by Camille Fournier](URL)
- DO NOT add any text or description after the hyperlink

Generate a complete career tips article in Markdown format with:
1. A compelling title (e.g., "From Senior to Staff: A Framework for IC Career Growth")
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags (e.g., ["career", "leadership", "staff-engineer", "growth"])
5. The full article content in Markdown (must include career diagrams, comparison tables, and references section)

Format your response as JSON:
{
  "title": "Career Tips: [Topic]",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
  "tags": ["career", "leadership", "tag3", "tag4"],
  "content": "Full career tips article..."
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

CRITICAL - References Section:
- After the final slide, add a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should be authoritative sources: official documentation, technical papers, reputable blogs, books
- Format each reference as a simple hyperlinked text WITHOUT any description after it
- Example format:
  - [AWS SageMaker HyperPod Official Documentation](URL)
  - [Scaling Laws for Neural Language Models](URL)
- DO NOT add any text or description after the hyperlink

Generate a complete LinkedIn carousel in Markdown format with:
1. A compelling title for the carousel
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags
5. The full carousel content in Markdown (4-10 slides with clear headings "## Slide N:" followed by references section)

Format your response as JSON:
{
  "title": "Carousel Title Here",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
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
        tldr: parsed.tldr || '',
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
