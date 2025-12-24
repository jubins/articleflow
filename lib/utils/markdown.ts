import { marked } from 'marked'
import { gfmHeadingId } from 'marked-gfm-heading-id'
import { mangle } from 'marked-mangle'

// Configure marked
marked.use(gfmHeadingId())
marked.use(mangle())
marked.use({
  gfm: true,
  breaks: true,
})

/**
 * Convert markdown to HTML for rich text editor
 */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string
}

/**
 * Basic HTML to markdown conversion
 * Note: For full conversion, consider using a library like turndown
 */
export function htmlToMarkdown(html: string): string {
  // This is a basic implementation
  // For production, consider using the 'turndown' library
  let markdown = html

  // Convert headings
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n')

  // Convert bold and italic
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
  markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**')
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*')
  markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*')

  // Convert links
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')

  // Convert lists
  markdown = markdown.replace(/<li>(.*?)<\/li>/g, '- $1\n')
  markdown = markdown.replace(/<\/?ul>/g, '\n')
  markdown = markdown.replace(/<\/?ol>/g, '\n')

  // Convert paragraphs
  markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n')

  // Convert code blocks
  markdown = markdown.replace(/<pre><code class="language-(.*?)">([\s\S]*?)<\/code><\/pre>/g, '```$1\n$2\n```\n')
  markdown = markdown.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```\n')
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`')

  // Convert blockquotes
  markdown = markdown.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (match, content) => {
    const lines = content.trim().split('\n')
    return lines.map((line: string) => `> ${line}`).join('\n') + '\n'
  })

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  markdown = markdown.replace(/&lt;/g, '<')
  markdown = markdown.replace(/&gt;/g, '>')
  markdown = markdown.replace(/&amp;/g, '&')
  markdown = markdown.replace(/&quot;/g, '"')

  return markdown.trim()
}
