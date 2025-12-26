import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/lib/types/database'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from 'docx'
import { R2StorageService } from '@/lib/services/r2-storage'

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

  let inCodeBlock = false
  let codeBlockContent: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Handle images
    const imageMatch = line.match(/!\[.*?\]\((.*?)\)/)
    if (imageMatch) {
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
        // End code block - create one paragraph with proper line breaks
        const textRuns: TextRun[] = []
        codeBlockContent.forEach((codeLine, index) => {
          textRuns.push(
            new TextRun({
              text: codeLine,
              font: 'Courier New',
              size: 20,
            })
          )
          // Add line break after each line except the last
          if (index < codeBlockContent.length - 1) {
            textRuns.push(new TextRun({ break: 1 }))
          }
        })

        children.push(
          new Paragraph({
            children: textRuns,
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
      children.push(
        new Paragraph({
          text: line.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      )
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      )
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 150 },
        })
      )
    } else if (line.startsWith('#### ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^####\s+/, ''),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 100 },
        })
      )
    } else if (line.trim() === '') {
      // Skip empty lines - they're handled by paragraph spacing
      continue
    } else {
      // Regular text - parse markdown formatting
      const textRuns = parseMarkdownLine(line)
      if (textRuns.length > 0) {
        children.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 200 },
          })
        )
      }
    }
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

function parseMarkdownLine(line: string): TextRun[] {
  const textRuns: TextRun[] = []
  const segments: Array<{text: string, bold?: boolean, italics?: boolean, code?: boolean}> = []

  // Match bold text
  const boldRegex = /\*\*(.*?)\*\*/g
  let match
  let lastIndex = 0

  while ((match = boldRegex.exec(line)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({ text: line.substring(lastIndex, match.index) })
    }
    // Add bold text
    segments.push({ text: match[1], bold: true })
    lastIndex = boldRegex.lastIndex
  }
  // Add remaining text
  if (lastIndex < line.length) {
    segments.push({ text: line.substring(lastIndex) })
  }

  // If no formatting found, return plain text
  if (segments.length === 0) {
    segments.push({ text: line })
  }

  // Convert segments to TextRuns
  for (const segment of segments) {
    if (segment.text.trim()) {
      textRuns.push(
        new TextRun({
          text: segment.text,
          bold: segment.bold,
          italics: segment.italics,
          font: segment.code ? 'Courier New' : undefined,
          shading: segment.code ? { fill: 'F5F5F5' } : undefined,
        })
      )
    }
  }

  return textRuns
}
