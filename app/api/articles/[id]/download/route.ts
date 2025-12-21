import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/lib/types/database'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

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

    if (format === 'md') {
      // Return markdown file
      return new NextResponse(typedArticle.content, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${fileName}.md"`,
        },
      })
    } else if (format === 'docx') {
      // Convert markdown to DOCX
      const docx = await convertMarkdownToDocx(typedArticle.title, typedArticle.content)

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

async function convertMarkdownToDocx(title: string, markdown: string): Promise<Buffer> {
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
