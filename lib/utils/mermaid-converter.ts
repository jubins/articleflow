import mermaid from 'mermaid'
import sharp from 'sharp'
import { uploadMermaidDiagram } from '@/lib/storage/r2'

/**
 * Mermaid initialization guard and config
 */
let initialized = false

export function initMermaid() {
  if (initialized) return

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

  initialized = true
}

/**
 * Convert all Mermaid diagrams in markdown content to WebP images
 */
export async function convertMermaidToImages(markdown: string): Promise<string> {
  initMermaid()

  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  let updatedContent = markdown
  const matches = Array.from(markdown.matchAll(mermaidRegex))

  if (matches.length === 0) {
    return markdown
  }

  // Process each Mermaid diagram
  for (const match of matches) {
    const mermaidCode = match[1]

    try {
      // Render Mermaid to SVG
      const renderId = `diagram-${Date.now()}-${Math.random()}`
      const { svg } = await mermaid.render(renderId, mermaidCode)

      // Convert SVG to WebP
      const svgBuffer = Buffer.from(svg)
      const webpBuffer = await sharp(svgBuffer)
        .webp({ quality: 90 })
        .toBuffer()

      // Upload to R2
      const imageUrl = await uploadMermaidDiagram(webpBuffer)

      // Replace Mermaid code block with image markdown
      updatedContent = updatedContent.replace(match[0], `![Diagram](${imageUrl})`)
    } catch (err) {
      console.error('Error converting Mermaid diagram:', err)
      // Keep the original Mermaid code if conversion fails
    }
  }

  return updatedContent
}

/**
 * Renders Mermaid code to SVG
 */
export async function renderMermaidToSvg(
  mermaidCode: string,
  renderId: string
): Promise<string> {
  initMermaid()
  const { svg } = await mermaid.render(renderId, mermaidCode)
  return svg
}
