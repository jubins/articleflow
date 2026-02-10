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
- Include 2-3 diverse Mermaid diagrams (choose appropriate types based on content)
- Include 1-2 comparison tables for technologies, approaches, or features
- Include practical code examples with proper syntax
- Explain complex concepts clearly
- Structure with clear headings and subheadings
- Ensure technical accuracy
- IMPORTANT: Use plain text for all notation - NO LaTeX delimiters ($, \\(, \\)) - write O(n) not $O(n)$

CRITICAL - Diverse Mermaid Diagrams (Include 2-3 from these options based on content):
- **Flowchart**: For algorithms, processes, decision flows, logic paths
- **Sequence Diagram**: For API calls, service interactions, request/response flows
- **Class Diagram**: For OOP design, data models, inheritance hierarchies
- **State Diagram**: For state machines, lifecycle management, status transitions
- **Entity Relationship (ERD)**: For database schemas, data relationships
- **Mindmap**: For concept relationships, technology ecosystems, architecture decisions
- **Pie/Bar/Line Charts**: For performance metrics, benchmarks, comparisons
- **Timeline**: For project phases, version history, adoption roadmap
- **Git Graph**: For branching strategies, deployment workflows

Choose diagrams that make the content VISUAL and CLEAR. Examples:
- Article about caching? Include: Flowchart (cache decision flow), Sequence (cache hit/miss), Pie (cache hit rates)
- Article about microservices? Include: Architecture (service layout), Sequence (service communication), State (service lifecycle)
- Article about databases? Include: ERD (schema design), Flowchart (query optimization), Bar (performance comparison)

Keep diagrams simple, focused, and directly relevant to the content.

CRITICAL - Code Examples:
- Include real, working code examples
- Use proper language identifiers in code blocks
- Explain what the code does

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
- Include 2-3 diverse Mermaid diagrams showing the learning journey
- Use numbered steps or clear section headings
- Include a "What you'll build" or "What you'll learn" section
- End with "Next steps" or "Conclusion"
- IMPORTANT: Use plain text for all notation - NO LaTeX delimiters ($, \\(, \\)) - write O(n) not $O(n)$

CRITICAL - Step-by-Step Format:
- Number each major step clearly
- Provide code examples for each step
- Explain what each step accomplishes

CRITICAL - Diverse Mermaid Diagrams for Tutorials (Include 2-3 appropriate types):
- **Flowchart**: Tutorial workflow, decision points, error handling paths
- **Sequence Diagram**: How components interact, API request flows, authentication flows
- **State Diagram**: Application states, user journey states, deployment states
- **Timeline**: Project setup phases, learning progression, build stages
- **Gantt Chart**: Multi-step tutorial timeline, estimated time per section
- **User Journey**: User experience walkthrough, feature interaction flow
- **Git Graph**: Version control workflow, branching strategy for the tutorial

Choose diagrams that help learners visualize:
- The overall tutorial flow and progression
- How different parts/components interact
- State changes or transformations
- Time-based progression of steps

Examples for common tutorials:
- Building an API? Include: Flowchart (request flow), Sequence (endpoint interactions), State (resource lifecycle)
- Setting up CI/CD? Include: Flowchart (pipeline stages), Gantt (deployment timeline), Git (branching strategy)
- Creating an app? Include: User Journey (feature flow), Sequence (data flow), State (app states)

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
- Include 2-3 visual comparison diagrams using Mermaid
- Include pros and cons for each option
- Include use case recommendations
- Structure with clear sections for each option being compared
- Provide objective analysis with data/examples
- IMPORTANT: Use plain text for all notation - NO LaTeX delimiters ($, \\(, \\)) - write O(n) not $O(n)$

CRITICAL - Comparison Tables:
- Use Markdown table syntax
- Compare features, performance, pricing, use cases, etc.
- Make tables comprehensive and informative

CRITICAL - Visual Comparison Diagrams (Include 2-3 appropriate types):
- **Radar Chart**: Multi-dimensional feature comparison (performance, ease of use, cost, scalability, etc.)
- **Pie Chart**: Market share, adoption rates, usage distribution
- **Bar/Column Chart**: Performance benchmarks, speed comparisons, cost comparisons
- **Quadrant Chart**: Positioning tools/options (e.g., ease of use vs power, cost vs features)
- **Mindmap**: Feature ecosystem, technology stack options
- **Flowchart**: Decision tree for choosing between options
- **Timeline**: Evolution/maturity of each option, release history
- **Sankey Diagram**: Data flow differences, migration paths between options

Choose diagrams that make comparisons VISUAL and INSTANT to understand.

Examples for comparison articles:
- Comparing databases? Include: Radar (feature comparison), Bar (query performance), Quadrant (use case positioning)
- Comparing frameworks? Include: Bar (bundle size/speed), Pie (community size), Flowchart (which to choose)
- Comparing cloud providers? Include: Bar (pricing comparison), Radar (service offerings), Timeline (feature releases)

CRITICAL - Analysis:
- Provide objective comparisons
- Include specific examples or data
- Recommend which option for which use case
- Use diagrams to visualize key differences

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
- Include 2-3 visual diagrams to illustrate concepts
- Explain WHY each practice is important
- Include common pitfalls to avoid
- Structure with clear sections for each best practice
- IMPORTANT: Use plain text for all notation - NO LaTeX delimiters ($, \\(, \\)) - write O(n) not $O(n)$

CRITICAL - Code Examples:
- Show both good and bad examples
- Explain what makes the good example better
- Use proper code formatting

CRITICAL - Visual Diagrams for Best Practices (Include 2-3 appropriate types):
- **Flowchart**: Decision flow for applying practices, when to use each approach
- **Mindmap**: Related practices, concept relationships, practice categories
- **State Diagram**: Proper state transitions, lifecycle best practices
- **Sequence Diagram**: Correct interaction patterns, proper API usage flows
- **Requirement Diagram**: Requirements hierarchy, compliance requirements
- **Checklist/Kanban**: Implementation checklist, practice adoption roadmap
- **Before/After comparison**: Using side-by-side flowcharts or diagrams

Choose diagrams that clarify:
- When and how to apply each practice
- The impact of following vs ignoring practices
- Relationships between different practices
- Step-by-step implementation guidance

Examples for best practices articles:
- API design best practices? Include: Sequence (proper API flow), Flowchart (error handling), State (resource lifecycle)
- Security best practices? Include: Flowchart (auth flow), Requirement (security requirements), Sequence (secure communication)
- Code quality best practices? Include: Mindmap (quality pillars), Flowchart (code review process), State (refactoring stages)

CRITICAL - Practical Guidance:
- Focus on actionable recommendations
- Explain the reasoning behind each practice
- Include real-world scenarios
- Use diagrams to make abstract concepts concrete

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
- Include 2-3 diverse Mermaid diagrams showing the journey and solution
- Include implementation details with code examples
- Include performance metrics, results, or outcomes
- Structure: Problem → Solution → Implementation → Results → Lessons Learned
- Make it engaging and narrative-driven
- IMPORTANT: Use plain text for all notation - NO LaTeX delimiters ($, \\(, \\)) - write O(n) not $O(n)$

CRITICAL - Diverse Mermaid Diagrams for Case Studies (Include 2-3 appropriate types):
- **Flowchart**: Problem diagnosis flow, decision-making process, migration strategy
- **Sequence Diagram**: System interactions, API calls, service communication patterns
- **State Diagram**: System state transitions, workflow stages, deployment states
- **Timeline**: Project phases, implementation timeline, migration stages
- **Gantt Chart**: Project schedule, parallel work streams, milestone tracking
- **Sankey Diagram**: Data flow changes, traffic routing, resource allocation
- **Git Graph**: Deployment strategy, branching model, release process
- **Architecture (graph TD/LR)**: System architecture, component relationships
- **Before/After Flowcharts**: System comparison showing improvements

Use ONLY basic Mermaid graph syntax wrapped in \`\`\`mermaid code blocks
DO NOT use C4 diagrams, cloud/server/database/compute/auth keywords, or advanced Mermaid features
Use only: graph TD, graph LR, flowchart, sequenceDiagram, stateDiagram, timeline, gantt, sankey, gitGraph, or simple classDiagram

Choose diagrams that tell the story:
- How you identified and analyzed the problem
- The solution architecture and implementation approach
- The transformation journey and results

Examples for case studies:
- Migration case study? Include: Timeline (migration phases), Sankey (traffic routing), Architecture (new system)
- Performance optimization? Include: Flowchart (optimization decisions), Sequence (improved flow), State (system states)
- System redesign? Include: Before/After Architecture, Timeline (rollout), Gantt (project schedule)

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
- Target word count: 3500-4500 words (comprehensive coverage with detailed examples)
- Follow the logical order used in real systems design interviews
- Include HIGH-LEVEL DESIGN (HLD) diagrams showing complete system architecture
- Include detailed API/endpoint definitions
- Include scale estimation calculations
- Include data models and storage design
- Include component-level design details
- Address scaling, reliability, fault tolerance, security, and trade-offs
- IMPORTANT: Use plain text for all notation - NO LaTeX delimiters ($, \\(, \\)) - write O(n) not $O(n)$

CRITICAL - Interview Framework Structure (follow this exact order):
1. **Requirements Clarification** (~350 words)
   - Present requirements in TABLES for clarity and scannability

   **Functional Requirements Table:**
   | Requirement ID | Feature | Description | Priority |
   |----------------|---------|-------------|----------|
   | FR-1 | User Registration | Users can sign up with email/password | High |
   | FR-2 | Content Creation | Users can create and publish posts | High |
   | FR-3 | Search | Full-text search across content | Medium |
   (Include 5-7 functional requirements relevant to the system)

   **Non-Functional Requirements Table:**
   | Category | Requirement | Target Metric |
   |----------|-------------|---------------|
   | Scalability | Support growth | Handle 10M+ users |
   | Availability | High uptime | 99.9% availability |
   | Latency | Fast response | <200ms API response |
   | Consistency | Data accuracy | Eventual consistency acceptable |
   | Durability | Data persistence | Zero data loss |
   (Include 4-6 non-functional requirements)

   **Constraints & Assumptions Table:**
   | Category | Constraint/Assumption | Details |
   |----------|----------------------|---------|
   | Budget | Infrastructure cost | $X/month cloud budget |
   | Timeline | Development time | 6 months to MVP |
   | Team | Engineering resources | 5 backend, 3 frontend engineers |
   | Technology | Existing stack | Must integrate with existing auth system |
   (Include 3-5 constraints)

2. **API / Endpoint Definitions** (~400 words)
   - Define 7-9 COMPLETE REST APIs with detailed request/response examples
   - Cover all CRUD operations and key system operations
   - Include HTTP methods, paths, headers, request bodies, response formats, and status codes
   - Group endpoints logically (e.g., User APIs, Content APIs, Analytics APIs)

   **Example Format (provide 7-9 endpoints like this):**

   **1. Create User Account**
   POST /api/v1/users/register
   Headers: Content-Type: application/json

   Request Body:
   {
     "email": "user@example.com",
     "password": "securePass123",
     "username": "johndoe",
     "fullName": "John Doe"
   }

   Response (201 Created):
   {
     "userId": "usr_abc123",
     "email": "user@example.com",
     "username": "johndoe",
     "createdAt": "2024-01-15T10:30:00Z",
     "authToken": "eyJhbGc..."
   }

   Error (400 Bad Request):
   {
     "error": "EMAIL_EXISTS",
     "message": "An account with this email already exists"
   }

   **2. User Login**
   POST /api/v1/auth/login
   Headers: Content-Type: application/json

   Request Body:
   {
     "email": "user@example.com",
     "password": "securePass123"
   }

   Response (200 OK):
   {
     "userId": "usr_abc123",
     "authToken": "eyJhbGc...",
     "refreshToken": "refresh_xyz789",
     "expiresIn": 3600
   }

   **3. Create Post/Content**
   POST /api/v1/posts
   Headers: Authorization: Bearer eyJhbGc..., Content-Type: application/json

   Request Body:
   {
     "title": "My First Post",
     "content": "This is the post content...",
     "tags": ["tech", "programming"],
     "visibility": "public"
   }

   Response (201 Created):
   {
     "postId": "post_xyz456",
     "title": "My First Post",
     "authorId": "usr_abc123",
     "createdAt": "2024-01-15T11:00:00Z",
     "status": "published",
     "url": "https://example.com/posts/post_xyz456"
   }

   **Continue with 4-6 more endpoints covering:**
   - GET /api/v1/posts/{postId} - Retrieve a post
   - PUT /api/v1/posts/{postId} - Update a post
   - DELETE /api/v1/posts/{postId} - Delete a post
   - GET /api/v1/posts?page=1&limit=20 - List posts with pagination
   - GET /api/v1/users/{userId}/profile - Get user profile
   - POST /api/v1/search - Search content

   Include full request/response examples for ALL 7-9 endpoints.

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

5. **Data Models & Storage Design** (~450 words)
   - Cover ALL storage types used in the system: Relational DB, NoSQL, Redis/Cache, Object Storage
   - Provide detailed schemas for each storage type
   - Explain WHY each storage type is chosen for specific use cases

   **A. Relational Database (PostgreSQL/MySQL) - Primary Data Store**
   - Define complete table schemas with columns, data types, and constraints
   - Include Entity Relationship Diagram (ERD) using Mermaid
   - Show relationships: one-to-one, one-to-many, many-to-many
   - Include indexing strategies for performance

   **Example Table Schemas (use proper SQL formatting in article):**

   -- Users Table
   CREATE TABLE users (
     user_id UUID PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     username VARCHAR(50) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     full_name VARCHAR(100),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     INDEX idx_email (email),
     INDEX idx_username (username)
   );

   -- Posts Table
   CREATE TABLE posts (
     post_id UUID PRIMARY KEY,
     author_id UUID NOT NULL,
     title VARCHAR(500) NOT NULL,
     content TEXT NOT NULL,
     status VARCHAR(20) DEFAULT 'draft',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
     INDEX idx_author (author_id),
     INDEX idx_status (status),
     INDEX idx_created (created_at)
   );

   **ERD Diagram (using Mermaid - wrap in proper mermaid code block in article):**

   erDiagram
     USERS ||--o{ POSTS : creates
     USERS ||--o{ COMMENTS : writes
     POSTS ||--o{ COMMENTS : has
     POSTS }o--o{ TAGS : tagged_with
     USERS {
       uuid user_id PK
       string email UK
       string username UK
       string password_hash
       timestamp created_at
     }
     POSTS {
       uuid post_id PK
       uuid author_id FK
       string title
       text content
       string status
       timestamp created_at
     }
     COMMENTS {
       uuid comment_id PK
       uuid post_id FK
       uuid user_id FK
       text content
       timestamp created_at
     }
     TAGS {
       uuid tag_id PK
       string name UK
     }

   **B. NoSQL Database (MongoDB/DynamoDB) - For Flexible/High-Write Data**
   - Use for data that needs flexible schema or high write throughput
   - Define document/item structures with nested fields

   **Example Document Schemas (format as JSON in article):**

   // User Activity Log Collection (MongoDB)
   {
     "_id": "log_abc123",
     "userId": "usr_abc123",
     "eventType": "page_view",
     "timestamp": "2024-01-15T10:30:00Z",
     "metadata": {
       "pageUrl": "/posts/post_xyz456",
       "referrer": "https://google.com",
       "deviceType": "mobile",
       "location": {
         "country": "US",
         "city": "San Francisco"
       }
     }
   }

   // Analytics Aggregations (DynamoDB)
   {
     "PK": "ANALYTICS#2024-01-15",
     "SK": "POST#post_xyz456",
     "views": 1250,
     "likes": 45,
     "comments": 12,
     "shares": 8
   }

   **C. Redis Cache - For Hot Data & Session Storage**
   - Define caching strategies with TTL (Time To Live)
   - Show key patterns and data structures used

   **Redis Key Patterns & Structures:**

   // User Session (Hash) - TTL: 24 hours
   Key: session:{sessionId}
   Value: {"userId": "usr_abc123", "authToken": "eyJhbGc...", "loginTime": "2024-01-15T10:00:00Z"}

   // Hot Posts Cache (String) - TTL: 5 minutes
   Key: post:{postId}
   Value: <JSON string of post data>

   // User Feed Cache (List) - TTL: 10 minutes
   Key: feed:{userId}
   Value: [postId1, postId2, postId3, ...]

   // Post View Counter (String) - TTL: 1 hour
   Key: post:views:{postId}
   Value: 1250

   // Rate Limiting (String with expiry)
   Key: ratelimit:{userId}:{endpoint}
   Value: 45 (request count)
   TTL: 60 seconds

   **D. Object Storage (S3/GCS) - For Media Files**

   Structure:
   /uploads/{userId}/{fileId}.{ext}
   /thumbnails/{postId}/{size}.jpg
   /avatars/{userId}/profile.jpg

   Metadata stored in relational DB:
   - file_id, user_id, file_path, file_size, mime_type, uploaded_at

   **Why This Storage Architecture?**
   - **Relational DB**: Transactional consistency for core data (users, posts, relationships)
   - **NoSQL**: Flexible schema for analytics, logs, and time-series data
   - **Redis**: Ultra-fast access for sessions, hot data, rate limiting, counters
   - **Object Storage**: Cost-effective storage for large binary files (images, videos)

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

  dsa: `You are an expert algorithms instructor and competitive programming coach creating a comprehensive DSA (Data Structures & Algorithms) article for {{platform}}.

Topic: {{topic}}

Requirements:
- Create a complete DSA learning article with theory + practical problem solving
- Target word count: 2000-2500 words
- Focus on ONE specific data structure or algorithm topic
- Include brief theory, intuition, and visual explanations
- Solve ONE complete LeetCode-style problem with MULTIPLE approaches
- Provide step-by-step walkthrough with diagrams
- Include complexity analysis for each approach
- Provide practice problems and LeetCode links

CRITICAL - Article Structure:

1. **Introduction & Motivation** (~150 words)
   - Why is this topic important?
   - Real-world use cases
   - What problems does it solve?
   - What will readers learn?

2. **Core Concept & Theory** (~300 words)
   - Brief explanation of the data structure/algorithm
   - Key properties and characteristics
   - When to use it vs when NOT to use it
   - Visual diagram showing the concept using Mermaid

   **Include a concept diagram like:**
   - Tree structure for Binary Trees
   - Graph for Graph algorithms
   - Array/linked list representation
   - State machine for DP problems
   - Stack/Queue visualization

3. **Problem Statement** (~100 words)
   - Present ONE LeetCode-style problem (Medium or Hard difficulty)
   - Clear problem description
   - Include constraints (e.g., 1 <= n <= 10^5)
   - Provide 2-3 examples with explanations

   **Example Format:**
   Problem: [Problem Name] (LeetCode #XXX equivalent)

   Given...
   Return...

   Constraints:
   - 1 <= n <= 10^5
   - -10^9 <= values <= 10^9

   Example 1:
   Input: [example]
   Output: [result]
   Explanation: [why]

   Example 2:
   Input: [example]
   Output: [result]

4. **Approach 1: Brute Force / Naive Solution** (~250 words)
   - Explain the straightforward approach
   - Include step-by-step walkthrough
   - Provide complete code solution (Python, Java, or C++)
   - Time Complexity: O(?)
   - Space Complexity: O(?)
   - Why this approach works
   - Limitations and why we need better approaches

   **Code format:**
   Include complete, working code with comments

5. **Approach 2: Optimized Solution** (~350 words)
   - Explain the optimized approach using the target DS/Algorithm
   - Key insights and intuition
   - Step-by-step algorithm walkthrough
   - Visual walkthrough using Mermaid flowchart showing state transitions
   - Complete code solution with detailed comments
   - Time Complexity: O(?)
   - Space Complexity: O(?)
   - Why this is better than brute force

   **Include walkthrough diagram:**
   Use Mermaid to show:
   - Step-by-step state changes
   - How the algorithm progresses
   - Key decision points
   - Example execution flow

6. **Approach 3: Most Optimal / Advanced Solution** (~300 words) [if applicable]
   - If there's an even better approach, explain it
   - Advanced techniques or optimizations
   - Trade-offs between approaches
   - Complete code solution
   - Time Complexity: O(?)
   - Space Complexity: O(?)
   - When to use this vs previous approaches

7. **Complexity Comparison Table**
   Create a table comparing all approaches:
   | Approach | Time Complexity | Space Complexity | Pros | Cons |
   |----------|----------------|------------------|------|------|
   | Brute Force | O(n²) | O(1) | Simple, easy to understand | Too slow for large inputs |
   | Optimized | O(n log n) | O(n) | Much faster | Uses extra space |
   | Advanced | O(n) | O(n) | Optimal time | More complex logic |

8. **Common Pitfalls & Edge Cases** (~150 words)
   - List 3-5 common mistakes
   - Edge cases to watch out for
   - How to handle them
   - Debugging tips

9. **Practice Problem (Homework)** (~100 words)
   - Provide ONE related LeetCode-style problem for readers to solve
   - Similar difficulty but different variation
   - Brief hint or approach suggestion
   - DO NOT provide solution code

   **Format:**
   **Practice Problem:** [Problem Name]

   [Brief description]

   Try to solve this yourself! It uses the same concepts we covered.

   Hint: Think about [subtle hint]

10. **Related Problems & Further Practice** (~100 words)
    - Provide 3-4 ACTUAL LeetCode problem links
    - Format as clickable links
    - Brief description of what each problem practices

    **Example format:**
    - [Two Sum (LeetCode #1)](https://leetcode.com/problems/two-sum/) - Classic hash table problem
    - [Three Sum (LeetCode #15)](https://leetcode.com/problems/3sum/) - Two-pointer technique
    - [Container With Most Water (LeetCode #11)](https://leetcode.com/problems/container-with-most-water/) - Greedy approach
    - [Trapping Rain Water (LeetCode #42)](https://leetcode.com/problems/trapping-rain-water/) - Advanced two-pointer

CRITICAL - Code Examples:
- Provide complete, working code (not pseudocode)
- Use Python, Java, or C++ (choose the most appropriate)
- Include detailed inline comments explaining each step
- Show proper formatting and style
- Make code copy-pastable and runnable

CRITICAL - Visual Diagrams:
- Use Mermaid diagrams to visualize concepts and walkthroughs
- Show the data structure (tree, graph, array, etc.)
- Show algorithm execution steps
- Use flowcharts for decision-making processes
- Keep diagrams simple and focused

**Example Concept Diagram:**
For Binary Tree:
graph TD
    A[10] --> B[5]
    A --> C[15]
    B --> D[3]
    B --> E[7]
    C --> F[12]
    C --> G[20]

**Example Walkthrough Diagram:**
For algorithm steps:
flowchart TD
    Start[Start: Array input] --> Init[Initialize pointers]
    Init --> Check{Is left < right?}
    Check -->|Yes| Process[Process current elements]
    Process --> Update[Update pointers]
    Update --> Check
    Check -->|No| End[Return result]

CRITICAL - Complexity Analysis:
- Always provide Big-O notation for time and space
- Use PLAIN TEXT notation: O(n), O(log n), O(n²), O(1) - NOT LaTeX format
- DO NOT use dollar signs or LaTeX delimiters like $O(n)$ or \\(O(n)\\)
- Write complexity as plain text: "Time Complexity: O(n log n)" or just "O(n log n)"
- Explain WHY the complexity is what it is
- Compare complexities across approaches
- Mention best case, average case, worst case if relevant

CRITICAL - LeetCode Links:
- Provide REAL LeetCode problem links (use actual problem URLs)
- Format: [Problem Name (LeetCode #NUMBER)](https://leetcode.com/problems/problem-slug/)
- Choose problems that are related to the topic
- Mix of Easy, Medium, and Hard difficulties
- Make links clickable in markdown

CRITICAL - References Section:
- End the article with a "## Further Reading & Resources" section
- Include 4-5 relevant references as a bulleted list
- References should include: algorithm books, visualizations, courses, documentation
- Format each reference as a simple hyperlinked text WITHOUT any description after it
- Example format:
  - [Introduction to Algorithms (CLRS)](URL)
  - [LeetCode Problem Set - [Topic]](URL)
  - [Visualgo - Algorithm Visualizations](URL)
- DO NOT add any text or description after the hyperlink

Generate a complete DSA article in Markdown format with:
1. A compelling title (e.g., "Mastering Binary Search: From Theory to LeetCode")
2. A brief description (MUST be between 151-160 characters - not shorter, not longer)
3. A TL;DR summary (MUST be exactly 135 characters or less)
4. 3-5 relevant tags (e.g., ["algorithms", "leetcode", "binary-search", "dsa"])
5. The full article content in Markdown (must include theory, problem solving with multiple approaches, diagrams, practice problems, and references section)

Format your response as JSON:
{
  "title": "DSA: [Topic]",
  "description": "Brief description for SEO (151-160 characters)",
  "tldr": "TL;DR summary (135 characters max)",
  "tags": ["algorithms", "dsa", "leetcode", "tag4"],
  "content": "Full DSA article..."
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

CRITICAL - Diverse Mermaid Diagrams for Carousel Slides (Include 2-3 diagrams):
- **Flowchart**: Process flows, decision trees, step-by-step workflows
- **Mindmap**: Concept relationships, topic breakdown, technology ecosystem
- **Pie/Bar/Line Charts**: Statistics, usage data, market share, performance metrics
- **Sequence Diagram**: Interaction patterns, API flows, communication sequences
- **State Diagram**: State transitions, lifecycle stages, workflow states
- **Timeline**: Historical evolution, roadmap, project phases
- **Quadrant Chart**: Positioning frameworks, decision matrices
- **Kanban**: Task stages, development pipeline, workflow boards
- **Architecture (graph TD/LR)**: System overview, component relationships

Use ONLY basic Mermaid graph syntax wrapped in \`\`\`mermaid code blocks
DO NOT use C4 diagrams, cloud/server/database/compute/auth keywords, or advanced Mermaid features
Use only: graph TD, graph LR, flowchart, sequenceDiagram, stateDiagram, pie, mindmap, timeline, quadrantChart, kanban, or simple classDiagram

Choose diagrams that enhance understanding:
- Visual representation of key concepts (Mindmap, Flowchart)
- Data and statistics (Pie, Bar, Line charts)
- Processes and workflows (Flowchart, Sequence, State)
- Positioning and comparisons (Quadrant, Timeline)

Keep diagrams simple and focused on one concept per slide
2-4 slides should have diagrams showing concepts visually

Examples for carousel topics:
- Technology comparison? Include: Quadrant (positioning), Pie (market share), Bar (performance comparison)
- Process explanation? Include: Flowchart (process steps), State (workflow stages), Timeline (evolution)
- Concept overview? Include: Mindmap (concept breakdown), Flowchart (relationships), Architecture (system view)

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
