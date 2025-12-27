/**
 * Processes markdown content to replace mermaid diagrams with cached image URLs
 * Falls back to original mermaid code if no cached URLs are available
 */
export function replaceMermaidWithCachedImages(
  markdown: string,
  cachedDiagrams: Record<string, string> | null = null
): string {
  if (!cachedDiagrams || Object.keys(cachedDiagrams).length === 0) {
    // No cached diagrams, return original markdown
    return markdown
  }

  let index = 0
  const processedContent = markdown.replace(
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

  return processedContent
}
