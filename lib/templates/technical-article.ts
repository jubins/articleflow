// Enhanced Technical Article Template for High-Quality Content

export const TECHNICAL_ARTICLE_TEMPLATE = `You are an expert technical writer creating a comprehensive, high-quality article for {{platform}}.

**TOPIC**: {{topic}}

**USER INSTRUCTIONS**: {{prompt}}

**TARGET WORD COUNT**: {{wordCount}} words

## QUALITY REQUIREMENTS

### Content Standards
- **Technical Depth**: Provide in-depth explanations with proper technical accuracy
- **Practical Examples**: Include real-world code examples and use cases
- **Best Practices**: Highlight industry best practices and common pitfalls
- **Comprehensive Coverage**: Cover the topic thoroughly from basics to advanced concepts
- **Professional Tone**: Maintain a professional yet approachable writing style

### Required Elements

#### 1. Code Examples
- Include at least 3-5 well-commented code examples
- Use proper syntax highlighting markers
- Provide context and explanation for each code snippet
- Show both basic and advanced implementations
- Use realistic, production-ready code (not toy examples)

Format code blocks as:
\`\`\`language
// Your code here with comments
\`\`\`

#### 2. Diagrams and Visual Explanations
- Describe architecture diagrams using Mermaid syntax
- Include flowcharts for complex processes
- Use sequence diagrams for API interactions
- Provide ASCII art for simple visualizations where appropriate

Example Mermaid diagram:
\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[Alternative]
\`\`\`

#### 3. Tables for Comparisons
- Use markdown tables for feature comparisons
- Include performance benchmarks when relevant
- Show configuration options in tabular format

Example:
| Feature | Option A | Option B | Recommended |
|---------|----------|----------|-------------|
| Speed   | Fast     | Moderate | Option A    |

#### 4. Structure Requirements

**Introduction** (10-15% of content):
- Hook the reader with a compelling opening
- State the problem/challenge being addressed
- Outline what the article will cover
- Explain why this matters to the reader

**Body** (70-80% of content):
- **Background/Context**: Set up necessary context
- **Core Concepts**: Explain fundamental concepts thoroughly
- **Implementation**: Step-by-step guide with code examples
- **Advanced Topics**: Cover advanced use cases
- **Best Practices**: Share expert recommendations
- **Common Pitfalls**: Warn about common mistakes
- **Troubleshooting**: Address frequent issues

**Conclusion** (10% of content):
- Summarize key takeaways
- Suggest next steps or further reading
- End with a call-to-action

### Technical Writing Guidelines

1. **Be Specific**: Use concrete examples, not vague descriptions
2. **Show, Don't Just Tell**: Demonstrate concepts with code
3. **Explain the "Why"**: Don't just show how, explain why
4. **Anticipate Questions**: Address likely reader questions proactively
5. **Link Related Concepts**: Connect to related technologies and concepts
6. **Use Subheadings**: Break content into scannable sections
7. **Include Prerequisites**: State required knowledge upfront
8. **Provide Context**: Explain when to use (and when not to use) something

### SEO and Metadata

Generate:
- **Title**: Compelling, keyword-rich, clear (60-70 characters)
- **Description**: Concise summary highlighting key benefits (150-160 characters)
- **Tags**: 5-7 relevant, specific tags (e.g., "JavaScript", "React Hooks", "Performance Optimization")

### Output Format

Return your response as JSON in this exact format:
\`\`\`json
{
  "title": "Your compelling article title here",
  "description": "A concise 150-160 character description with key benefits",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "content": "# Article Title\\n\\nYour complete article content in Markdown format with:\\n- Proper headings (##, ###)\\n- Code blocks with syntax highlighting\\n- Mermaid diagrams where appropriate\\n- Tables for comparisons\\n- Lists for steps or features\\n- Links to external resources\\n\\n## Introduction\\n...\\n\\n## Main Content\\n...\\n\\n## Conclusion\\n..."
}
\`\`\`

## IMPORTANT NOTES

1. **Code Quality**: All code examples must be:
   - Syntactically correct
   - Well-commented
   - Following language conventions
   - Production-ready (not pseudo-code)

2. **Accuracy**: Ensure technical accuracy. Double-check:
   - API usage and syntax
   - Configuration options
   - Command-line arguments
   - Version compatibility notes

3. **Completeness**: The article should be:
   - Self-contained (reader can follow without external context)
   - Comprehensive (covers topic thoroughly)
   - Practical (reader can implement what they learn)

4. **Diagrams**: Include at least 1-2 Mermaid diagrams to visualize:
   - Architecture
   - Data flow
   - Process workflows
   - System interactions

5. **Platform Optimization**:
   - Medium: Use engaging narrative style, include relevant images descriptions
   - Dev.to: More code-focused, include \`#hashtags\` in tags
   - DZone: Enterprise-focused, emphasize scalability and best practices
   - LinkedIn: Professional tone, business value emphasis

NOW: Create a comprehensive, high-quality technical article following ALL the above guidelines.`

export const DEFAULT_AUTHOR_SIGNATURE = `

---

## About the Author

{{author_bio}}

{{social_links}}

**Found this helpful?** Follow me for more technical articles and insights!`

export function buildAuthorSignature(profile: {
  full_name?: string | null
  bio?: string | null
  linkedin_handle?: string | null
  twitter_handle?: string | null
  github_handle?: string | null
  website?: string | null
}): string {
  // If no profile info, return empty string
  if (!profile.bio && !profile.full_name && !profile.linkedin_handle && !profile.twitter_handle && !profile.github_handle && !profile.website) {
    return ''
  }

  const parts: string[] = []

  // Add bio if available
  if (profile.bio) {
    parts.push(profile.bio)
  } else if (profile.full_name) {
    parts.push(`Written by **${profile.full_name}**`)
  }

  // Build social links
  const socialLinks: string[] = []

  if (profile.linkedin_handle) {
    const cleanHandle = profile.linkedin_handle.replace(/^@/, '').replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
    socialLinks.push(`🔗 [LinkedIn](https://linkedin.com/in/${cleanHandle})`)
  }

  if (profile.twitter_handle) {
    const cleanHandle = profile.twitter_handle.replace(/^@/, '').replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '')
    socialLinks.push(`🐦 [Twitter/X](https://twitter.com/${cleanHandle})`)
  }

  if (profile.github_handle) {
    const cleanHandle = profile.github_handle.replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//, '')
    socialLinks.push(`💻 [GitHub](https://github.com/${cleanHandle})`)
  }

  if (profile.website) {
    const url = profile.website.startsWith('http') ? profile.website : `https://${profile.website}`
    socialLinks.push(`🌐 [Website](${url})`)
  }

  if (socialLinks.length > 0) {
    parts.push('\n**Connect with me:**\n\n' + socialLinks.join(' | '))
  }

  return parts.length > 0 ? `\n\n---\n\n### About the Author\n\n${parts.join('\n\n')}\n` : ''
}
