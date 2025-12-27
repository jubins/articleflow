import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { R2StorageService } from '@/lib/services/r2-storage'
import sharp from 'sharp'
import crypto from 'crypto'

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

    const { svg, slideIndex, articleId, mermaidCode } = await request.json()

    if (!svg) {
      return NextResponse.json(
        { error: 'SVG data is required' },
        { status: 400 }
      )
    }

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Clean and prepare SVG
    let cleanSvg = svg.trim()

    // Check if SVG has dimensions, if not add default ones
    if (!cleanSvg.includes('width=') || !cleanSvg.includes('height=')) {
      // Extract viewBox if present to determine dimensions
      const viewBoxMatch = cleanSvg.match(/viewBox="([^"]+)"/)
      let width = 800
      let height = 600

      if (viewBoxMatch) {
        const viewBox = viewBoxMatch[1].split(' ')
        width = parseInt(viewBox[2]) || 800
        height = parseInt(viewBox[3]) || 600
      }

      // Add dimensions to SVG
      cleanSvg = cleanSvg.replace(
        /<svg/,
        `<svg width="${width}" height="${height}"`
      )
    }

    console.log('Converting carousel diagram to WebP. SVG length:', cleanSvg.length)

    // Convert SVG string to buffer with UTF-8 encoding
    const svgBuffer = Buffer.from(cleanSvg, 'utf-8')

    // Convert SVG to WebP using sharp with proper density for better quality
    const webpBuffer = await sharp(svgBuffer, {
      density: 150 // Higher DPI for better quality
    })
      .webp({ quality: 90 })
      .toBuffer()

    console.log('Successfully converted to WebP. Size:', webpBuffer.length, 'bytes')

    // Upload to R2
    const r2Service = new R2StorageService()

    // Generate unique filename using mermaidCode if available, otherwise use SVG
    // This ensures consistent naming with PPTX export
    const hashSource = mermaidCode || cleanSvg
    const hash = crypto.createHash('md5').update(hashSource).digest('hex').substring(0, 8)
    const fileName = `carousel-diagram-${slideIndex || 0}-${hash}.webp`

    console.log(`Generated filename: ${fileName}${mermaidCode ? ' (using mermaid code hash)' : ' (using SVG hash)'}`)

    const uploadResult = await r2Service.upload({
      buffer: webpBuffer,
      contentType: 'image/webp',
      fileName,
      folder: `articles/${articleId}/diagrams`,
    })

    console.log('Uploaded diagram to R2:', uploadResult.url)

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
    })
  } catch (error) {
    console.error('Error uploading carousel diagram:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.json(
      {
        error: 'Failed to upload diagram',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
