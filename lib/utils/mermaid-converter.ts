import mermaid from 'mermaid'
import { uploadMermaidDiagram } from '@/lib/storage/r2'

/**
 * Convert all Mermaid diagrams in markdown content to SVG images
 */
export async function convertMermaidToImages(markdown: string): Promise<string> {
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  let updatedContent = markdown
  const matches = Array.from(markdown.matchAll(mermaidRegex))

  if (matches.length === 0) {
    return markdown
  }

  // Initialize mermaid for server-side rendering
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    themeVariables: {
      primaryColor: '#f0f9ff',
      primaryTextColor: '#1e293b',
      primaryBorderColor: '#3b82f6',
      lineColor: '#64748b',
      secondaryColor: '#e0f2fe',
      tertiaryColor: '#f8fafc',
      background: '#ffffff',
      mainBkg: '#ffffff',
      secondBkg: '#f8fafc',
    },
    securityLevel: 'loose',
    fontFamily: 'system-ui, sans-serif',
  })

  // Process each mermaid diagram
  for (const match of matches) {
    const mermaidCode = match[1]

    try {
      // Render mermaid to SVG
      const { svg } = await mermaid.render(`diagram-${Date.now()}-${Math.random()}`, mermaidCode)

      // Convert SVG string to buffer
      const svgBuffer = Buffer.from(svg, 'utf-8')

      // Upload SVG to R2
      const imageUrl = await uploadMermaidDiagram(svgBuffer)

      // Replace mermaid code block with image markdown
      updatedContent = updatedContent.replace(match[0], `![Diagram](${imageUrl})`)
    } catch (err) {
      console.error('Error converting Mermaid diagram:', err)
      // Keep the original Mermaid code if conversion fails
    }
  }

  return updatedContent
}
