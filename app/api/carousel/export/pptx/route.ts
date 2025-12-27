import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PPTXGeneratorService } from '@/lib/services/pptx-generator'
import { R2StorageService } from '@/lib/services/r2-storage'
import sharp from 'sharp'
import crypto from 'crypto'
import mermaid from 'mermaid'
import { getCachedDiagramUrl, saveDiagramToCache } from '@/lib/utils/diagram-cache'

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

            // Step 1: Check database cache first
            console.log(`Checking database cache for diagram ${diagramIndex + 1} on slide ${slideIndex + 1}...`)
            const cachedUrl = await getCachedDiagramUrl(articleId, diagramCode)

            if (cachedUrl) {
              console.log(`✓ Found diagram in database cache, reusing it`)
              urls.push(cachedUrl)
              continue // Skip to next diagram
            }

            console.log(`✗ Diagram not in database cache, checking R2...`)

            // Step 2: Check R2 storage
            const hash = crypto.createHash('md5').update(diagramCode).digest('hex').substring(0, 8)
            const fileName = `carousel-diagram-${slideIndex}-${hash}.webp`

            // Construct expected R2 URL
            const r2AccountId = process.env.R2_ACCOUNT_ID
            const expectedUrl = `https://pub-${r2AccountId}.r2.dev/articles/${articleId}/diagrams/${fileName}`

            console.log(`Checking if diagram exists in R2: ${expectedUrl}`)

            // Try to fetch existing diagram from R2
            let diagramUrl = expectedUrl
            let shouldUpload = false

            try {
              const headResponse = await fetch(expectedUrl, { method: 'HEAD' })
              if (headResponse.ok) {
                console.log(`✓ Diagram found in R2, reusing it`)
                diagramUrl = expectedUrl
                // Save to cache for future use
                await saveDiagramToCache(articleId, diagramCode, diagramUrl)
              } else {
                console.log(`✗ Diagram not found in R2 (${headResponse.status}), will render and upload`)
                shouldUpload = true
              }
            } catch (error) {
              console.log('✗ Error checking R2, will render and upload:', error)
              shouldUpload = true
            }

            // If diagram doesn't exist in R2, render and upload it
            if (shouldUpload) {
              console.log(`Rendering diagram ${diagramIndex + 1} for slide ${slideIndex + 1} server-side...`)

              // Render Mermaid diagram to SVG server-side
              const { svg } = await mermaid.render(
                `pptx-diagram-${slideIndex}-${diagramIndex}`,
                diagramCode
              )

              // Convert SVG string to buffer
              const svgBuffer = Buffer.from(svg, 'utf-8')

              // Convert SVG to WebP using sharp with proper density for quality
              const webpBuffer = await sharp(svgBuffer, {
                density: 150 // Higher DPI for better quality
              })
                .webp({ quality: 90 })
                .toBuffer()

              // Upload to R2
              const uploadResult = await r2Service.upload({
                buffer: webpBuffer,
                contentType: 'image/webp',
                fileName,
                folder: `articles/${articleId}/diagrams`,
              })

              console.log(`Uploaded new diagram to R2: ${uploadResult.url}`)
              diagramUrl = uploadResult.url

              // Save to cache for future use
              await saveDiagramToCache(articleId, diagramCode, diagramUrl)
            }

            urls.push(diagramUrl)
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
