/**
 * Diagram Processing Service
 * Handles conversion of Mermaid diagrams to images and caching in R2
 */

import { R2StorageService } from './r2-storage'

interface MermaidDiagram {
  code: string
  index: number
}

interface ProcessDiagramsResult {
  success: boolean
  diagrams: Record<string, string>
  content?: string
  error?: string
}

/**
 * Extract all Mermaid diagrams from markdown content
 */
function extractMermaidDiagrams(content: string): MermaidDiagram[] {
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  const diagrams: MermaidDiagram[] = []
  let match
  let index = 0

  while ((match = mermaidRegex.exec(content)) !== null) {
    diagrams.push({
      code: match[1].trim(),
      index: index++,
    })
  }

  return diagrams
}

/**
 * Replace Mermaid code blocks with image URLs
 */
export function replaceMermaidWithImages(
  markdown: string,
  diagrams: Record<string, string>
): string {
  let index = 0
  return markdown.replace(
    /```mermaid\n([\s\S]*?)```/g,
    (match) => {
      const diagramKey = `diagram-${index}`
      const imageUrl = diagrams[diagramKey]
      index++

      if (imageUrl) {
        // Extract a meaningful description from the mermaid code
        const mermaidCode = match.match(/```mermaid\n([\s\S]*?)```/)?.[1] || ''
        const firstLine = mermaidCode.trim().split('\n')[0]
        const description = firstLine.includes('graph') || firstLine.includes('flowchart')
          ? 'Flowchart Diagram'
          : firstLine.includes('sequenceDiagram')
          ? 'Sequence Diagram'
          : firstLine.includes('classDiagram')
          ? 'Class Diagram'
          : firstLine.includes('stateDiagram')
          ? 'State Diagram'
          : firstLine.includes('erDiagram')
          ? 'ER Diagram'
          : firstLine.includes('gantt')
          ? 'Gantt Chart'
          : firstLine.includes('pie')
          ? 'Pie Chart'
          : 'Diagram'

        return `![${description}](${imageUrl})`
      }
      return match
    }
  )
}

/**
 * Process Mermaid diagrams in article content
 * Converts diagrams to PNG images and uploads to R2
 */
export async function processMermaidDiagrams(
  articleId: string,
  content: string
): Promise<ProcessDiagramsResult> {
  try {
    // Extract all Mermaid diagrams
    const diagrams = extractMermaidDiagrams(content)

    if (diagrams.length === 0) {
      return {
        success: true,
        diagrams: {},
        content,
      }
    }

    // Initialize R2 storage
    let r2: R2StorageService | null = null
    try {
      r2 = new R2StorageService()
    } catch (error) {
      console.error('R2 storage not configured:', error)
      return {
        success: false,
        diagrams: {},
        error: 'R2 storage not configured',
      }
    }

    const images = new Map<string, string>()

    // Convert each diagram to PNG and upload to R2
    for (const diagram of diagrams) {
      try {
        const diagramKey = `diagram-${diagram.index}`

        // Use mermaid.ink API to get PNG
        const base64Code = Buffer.from(diagram.code).toString('base64')
        const mermaidInkUrl = `https://mermaid.ink/img/${base64Code}`

        // Upload from URL to R2 as PNG
        const result = await r2.uploadFromUrl(mermaidInkUrl, {
          folder: `articles/${articleId}/diagrams`,
          fileName: `diagram-${diagram.index}.png`,
          convertToWebP: false,
        })

        images.set(diagramKey, result.url)
        console.log(`Successfully uploaded diagram ${diagram.index} to R2 as PNG:`, result.url)
      } catch (err) {
        console.error(`Failed to process diagram ${diagram.index}:`, err)
        // Continue processing other diagrams even if one fails
      }
    }

    if (images.size === 0) {
      return {
        success: false,
        diagrams: {},
        error: 'Failed to process any diagrams',
      }
    }

    const diagramsObject = Object.fromEntries(images)

    // Replace mermaid code with image URLs in content
    const updatedContent = replaceMermaidWithImages(content, diagramsObject)

    return {
      success: true,
      diagrams: diagramsObject,
      content: updatedContent,
    }
  } catch (error) {
    console.error('Process diagrams error:', error)
    return {
      success: false,
      diagrams: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
