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

    // Convert SVG to WebP using sharp
    const buffer = Buffer.from(svg)
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 90 })
      .toBuffer()

    // Upload to R2
    const imageUrl = await uploadMermaidDiagram(webpBuffer)

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error converting Mermaid diagram:', error)
    return NextResponse.json(
      { error: 'Failed to convert diagram' },
      { status: 500 }
    )
  }
}
