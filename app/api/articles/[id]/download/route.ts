import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/lib/types/database'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from 'docx'
import { R2StorageService } from '@/lib/services/r2-storage'

// Force Node.js runtime for docx package compatibility
export const runtime = 'nodejs'

interface MermaidDiagram {
  code: string
  index: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'md'

    // Get the article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    const typedArticle = article as Article | null

    if (articleError || !typedArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const fileName = typedArticle.file_id || typedArticle.id

    // Convert Mermaid diagrams to images
    const { content: processedContent } = await convertMermaidDiagramsToImages(
      typedArticle.content,
      typedArticle.id
    )

    if (format === 'md') {
      // Return markdown file with image URLs
      return new NextResponse(processedContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${fileName}.md"`,
        },
      })
    } else if (format === 'docx') {
      // Convert markdown to DOCX with embedded images
      const docx = await convertMarkdownToDocx(
        typedArticle.title,
        processedContent
      )

      return new NextResponse(new Uint8Array(docx), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${fileName}.docx"`,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "md" or "docx"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function convertMermaidDiagramsToImages(
  markdown: string,
  articleId: string
): Promise<{ content: string; images: Map<string, string> }> {
  const images = new Map<string, string>()

  // Extract all Mermaid diagrams
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  const diagrams: MermaidDiagram[] = []
  let match
  let index = 0

  while ((match = mermaidRegex.exec(markdown)) !== null) {
    diagrams.push({
      code: match[1].trim(),
      index: index++,
    })
  }

  if (diagrams.length === 0) {
    return { content: markdown, images }
  }

  try {
    // Initialize R2 storage
    const r2 = new R2StorageService()

    // Convert each diagram to an image and upload to R2
    for (const diagram of diagrams) {
      try {
        // Encode the Mermaid code as base64 for mermaid.ink API
        const base64Code = Buffer.from(diagram.code).toString('base64')
        const mermaidInkUrl = `https://mermaid.ink/img/${base64Code}`

        // Upload the image to R2
        const result = await r2.uploadFromUrl(mermaidInkUrl, {
          folder: `articles/${articleId}/diagrams`,
          fileName: `diagram-${diagram.index}.png`,
        })

        images.set(`diagram-${diagram.index}`, result.url)
      } catch (err) {
        console.error(`Failed to process diagram ${diagram.index}:`, err)
        // If conversion fails, keep the original Mermaid code
      }
    }

    // Replace Mermaid code blocks with image references
    let processedContent = markdown
    index = 0
    processedContent = processedContent.replace(
      /```mermaid\n([\s\S]*?)```/g,
      (match) => {
        const imageUrl = images.get(`diagram-${index}`)
        index++

        if (imageUrl) {
          return `![Architecture Diagram](${imageUrl})`
        }
        return match // Keep original if conversion failed
      }
    )

    return { content: processedContent, images }
  } catch (error) {
    console.error('Error converting Mermaid diagrams:', error)
    // Return original content if processing fails
    return { content: markdown, images }
  }
}

async function convertMarkdownToDocx(
  title: string,
  markdown: string
): Promise<Buffer> {
  const lines = markdown.split('\n')
  const children: Paragraph[] = []

  // Add title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    })
  )

  let currentParagraph: string[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []

  for (const line of lines) {
    // Handle images
    const imageMatch = line.match(/!\[.*?\]\((.*?)\)/)
    if (imageMatch) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }))
        currentParagraph = []
      }

      const imageUrl = imageMatch[1]
      try {
        // Fetch the image
        const response = await fetch(imageUrl)
        const arrayBuffer = await response.arrayBuffer()
        const imageBuffer = Buffer.from(arrayBuffer)

        // Add image to document
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                type: 'png',
                data: imageBuffer,
                transformation: {
                  width: 600,
                  height: 400,
                },
              }),
            ],
            spacing: { before: 200, after: 200 },
          })
        )
      } catch (err) {
        console.error('Failed to embed image:', err)
        // Skip image if fetch fails
      }
      continue
    }

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeBlockContent.join('\n'),
                font: 'Courier New',
                size: 20,
              }),
            ],
            spacing: { before: 200, after: 200 },
            shading: {
              fill: 'F5F5F5',
            },
          })
        )
        codeBlockContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    // Handle headings
    if (line.startsWith('# ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }))
        currentParagraph = []
      }
      children.push(
        new Paragraph({
          text: line.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      )
    } else if (line.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }))
        currentParagraph = []
      }
      children.push(
        new Paragraph({
          text: line.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      )
    } else if (line.startsWith('### ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }))
        currentParagraph = []
      }
      children.push(
        new Paragraph({
          text: line.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 150 },
        })
      )
    } else if (line.trim() === '') {
      // Empty line - end current paragraph
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }))
        currentParagraph = []
      }
    } else {
      // Regular text - clean markdown syntax
      const cleanedLine = line
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
        .trim()

      if (cleanedLine) {
        currentParagraph.push(cleanedLine)
      }
    }
  }

  // Add remaining paragraph
  if (currentParagraph.length > 0) {
    children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }))
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  return await Packer.toBuffer(doc)
}
