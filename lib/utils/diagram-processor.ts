import { formatTablesInMarkdown } from './table-formatter'

/**
 * Processes markdown content to replace mermaid diagrams with cached image URLs
 * and format plain text tables as markdown tables
 * Falls back to original mermaid code if no cached URLs are available
 */
export function replaceMermaidWithCachedImages(
  markdown: string,
  cachedDiagrams: Record<string, string> | null = null
): string {
  // First, format any plain text tables to markdown tables
  let processedContent = formatTablesInMarkdown(markdown)

  // Then replace mermaid diagrams with cached images if available
  if (cachedDiagrams && Object.keys(cachedDiagrams).length > 0) {
    let index = 0
    processedContent = processedContent.replace(
      /```mermaid\n([\s\S]*?)```/g,
      (match) => {
        const diagramKey = `diagram-${index}`
        const imageUrl = cachedDiagrams[diagramKey]
        index++

        if (imageUrl) {
          // Replace with markdown image syntax
          return `![Mermaid Diagram](${imageUrl})`
        }
        // If no cached URL for this diagram, keep original mermaid code
        return match
      }
    )
  }

  return processedContent
}
