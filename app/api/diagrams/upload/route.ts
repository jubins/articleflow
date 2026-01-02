import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { R2StorageService } from '@/lib/services/r2-storage'
import sharp from 'sharp'

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

    const { svg, diagramId, articleId } = await request.json()

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

    // Escape any unescaped ampersands that aren't part of entities
    cleanSvg = cleanSvg.replace(/&(?!(amp|lt|gt|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);)/g, '&amp;')

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

    // Convert SVG string to buffer with UTF-8 encoding
    const svgBuffer = Buffer.from(cleanSvg, 'utf-8')

    // Convert SVG to WebP using sharp with proper density for better quality
    const webpBuffer = await sharp(svgBuffer, {
      density: 300 // Higher DPI for better quality and text rendering
    })
      .webp({ quality: 95 })
      .toBuffer()

    // Upload to R2 in articles/{article-id}/diagrams folder
    const r2 = new R2StorageService()
    const result = await r2.upload({
      buffer: webpBuffer,
      contentType: 'image/webp',
      fileName: `diagram-${diagramId || Date.now()}.webp`,
      folder: `articles/${articleId}/diagrams`,
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    })
  } catch (error) {
    console.error('Error uploading diagram:', error)

    return NextResponse.json(
      {
        error: 'Failed to upload diagram',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
