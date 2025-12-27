import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PPTXGeneratorService } from '@/lib/services/pptx-generator'
import { R2StorageService } from '@/lib/services/r2-storage'
import sharp from 'sharp'
import crypto from 'crypto'
import mermaid from 'mermaid'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { content, theme, title, linkedinTeaser, articleId } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    console.log('Generating PPTX for carousel...')

    // Step 1: Extract and upload all Mermaid diagrams to R2
    const diagramUrls = await extractAndUploadDiagrams(content, articleId)

    console.log(`Uploaded ${diagramUrls.size} diagrams to R2`)

    // Step 2: Generate PPTX using the service
    const pptxService = new PPTXGeneratorService()

    const pptxBlob = await pptxService.generate({
      content,
      theme: theme || 'classic',
      title: title || 'LinkedIn Carousel',
      linkedinTeaser,
      diagramUrls,
    })

    console.log('PPTX generated successfully. Size:', pptxBlob.size, 'bytes')

    // Step 3: Return PPTX file
    const filename = title
      ? `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pptx`
      : 'carousel-presentation.pptx'

    return new NextResponse(pptxBlob as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pptxBlob.size.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PPTX:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'Failed to generate PPTX',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Extract Mermaid diagrams from content and upload to R2
 * Returns a map of slide index to diagram URLs
 */
async function extractAndUploadDiagrams(content: string, articleId: string): Promise<Map<number, string[]>> {
  const diagramUrls = new Map<number, string[]>()

  try {
    // Parse slides from content
    const slidePattern = /(?=^##\s+(?:Slide\s+\d+|[\d]+\.))/gm
    let slides = content.split(slidePattern).filter(s => s.trim())

    // If no specific slide markers, split by ## headings
    if (slides.length <= 1) {
      const headingPattern = /(?=^##\s+)/gm
      const altSlides = content.split(headingPattern).filter(s => s.trim())
      slides = altSlides.length > 1 ? altSlides : [content]
    }

    // Initialize mermaid
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      })
    }

    const r2Service = new R2StorageService()

    // Extract and upload diagrams from each slide
    for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
      const slideContent = slides[slideIndex]
      const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
      const matches = Array.from(slideContent.matchAll(mermaidRegex))

      if (matches.length > 0) {
        const urls: string[] = []

        for (let diagramIndex = 0; diagramIndex < matches.length; diagramIndex++) {
          try {
            const diagramCode = matches[diagramIndex][1]

            console.log(`Rendering diagram ${diagramIndex + 1} for slide ${slideIndex + 1} server-side...`)

            // Render Mermaid diagram to SVG server-side
            const { svg } = await mermaid.render(
              `pptx-diagram-${slideIndex}-${diagramIndex}`,
              diagramCode,
              {
                fontFamily: 'Arial, sans-serif',
              }
            )

            // Convert SVG string to buffer
            const svgBuffer = Buffer.from(svg, 'utf-8')

            // Convert SVG to WebP using sharp with proper density for quality
            const webpBuffer = await sharp(svgBuffer, {
              density: 150 // Higher DPI for better quality
            })
              .webp({ quality: 90 })
              .toBuffer()

            // Generate unique filename
            const hash = crypto.createHash('md5').update(diagramCode).digest('hex').substring(0, 8)
            const fileName = `carousel-diagram-slide${slideIndex + 1}-${diagramIndex + 1}-${hash}.webp`

            // Upload to R2
            const uploadResult = await r2Service.upload({
              buffer: webpBuffer,
              contentType: 'image/webp',
              fileName,
              folder: `articles/${articleId}/diagrams`,
            })

            console.log(`Uploaded diagram to R2: ${uploadResult.url}`)
            urls.push(uploadResult.url)
          } catch (error) {
            console.error(`Failed to process diagram ${diagramIndex + 1} for slide ${slideIndex + 1}:`, error)
          }
        }

        if (urls.length > 0) {
          diagramUrls.set(slideIndex, urls)
        }
      }
    }
  } catch (error) {
    console.error('Error extracting and uploading diagrams:', error)
  }

  return diagramUrls
}
