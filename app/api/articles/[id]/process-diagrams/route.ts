import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/lib/types/database'
import { R2StorageService } from '@/lib/services/r2-storage'

interface MermaidDiagram {
  code: string
  index: number
}

export async function POST(
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

    // Check if diagrams are already cached
    const cachedDiagrams = typedArticle.diagram_images as Record<string, string> | null
    if (cachedDiagrams && Object.keys(cachedDiagrams).length > 0) {
      return NextResponse.json({
        success: true,
        diagrams: cachedDiagrams,
        content: replaceMermaidWithImages(typedArticle.content, cachedDiagrams),
        cached: true
      })
    }

    // Extract all Mermaid diagrams
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
    const diagrams: MermaidDiagram[] = []
    let match
    let index = 0

    while ((match = mermaidRegex.exec(typedArticle.content)) !== null) {
      diagrams.push({
        code: match[1].trim(),
        index: index++,
      })
    }

    if (diagrams.length === 0) {
      return NextResponse.json({
        success: true,
        diagrams: {},
        content: typedArticle.content
      })
    }

    // Initialize R2 storage
    let r2: R2StorageService | null = null
    try {
      r2 = new R2StorageService()
    } catch (error) {
      console.error('R2 storage not configured:', error)
      return NextResponse.json(
        { error: 'R2 storage not configured' },
        { status: 500 }
      )
    }

    const images = new Map<string, string>()

    // Convert each diagram to SVG and upload to R2
    for (const diagram of diagrams) {
      try {
        const diagramKey = `diagram-${diagram.index}`

        // Use mermaid.ink API to get PNG
        const base64Code = Buffer.from(diagram.code).toString('base64')
        const mermaidInkUrl = `https://mermaid.ink/img/${base64Code}`

        // Upload from URL to R2 as PNG
        const result = await r2.uploadFromUrl(mermaidInkUrl, {
          folder: `articles/${typedArticle.id}/diagrams`,
          fileName: `diagram-${diagram.index}.png`,
          convertToWebP: false,
        })

        images.set(diagramKey, result.url)
        console.log(`Successfully uploaded diagram ${diagram.index} to R2 as PNG:`, result.url)
      } catch (err) {
        console.error(`Failed to process diagram ${diagram.index}:`, err)
      }
    }

    // Save cached diagrams to database
    if (images.size > 0) {
      const diagramsObject = Object.fromEntries(images)

      // Create a marker to indicate diagrams have been processed
      const timestamp = new Date().toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('articles')
        .update({
          diagram_images: diagramsObject,
          diagram_images_url: timestamp // Use timestamp as a marker that diagrams are cached
        })
        .eq('id', typedArticle.id)

      // Replace mermaid code with image URLs in content
      const updatedContent = replaceMermaidWithImages(typedArticle.content, diagramsObject)

      return NextResponse.json({
        success: true,
        diagrams: diagramsObject,
        content: updatedContent
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process diagrams'
    }, { status: 500 })
  } catch (error) {
    console.error('Process diagrams error:', error)
    return NextResponse.json(
      { error: 'Failed to process diagrams', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function replaceMermaidWithImages(
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
