import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { uploadMermaidDiagram } from '@/lib/storage/r2'

export async function POST(request: NextRequest) {
  try {
    const { svg } = await request.json()

    if (!svg) {
      return NextResponse.json(
        { error: 'SVG data is required' },
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

    console.log('Converting SVG to WebP. SVG length:', cleanSvg.length)

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
    const imageUrl = await uploadMermaidDiagram(webpBuffer)

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error converting Mermaid diagram:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'Failed to convert diagram',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
