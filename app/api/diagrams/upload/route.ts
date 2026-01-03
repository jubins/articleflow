import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { R2StorageService } from '@/lib/services/r2-storage'

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

    const r2 = new R2StorageService()

    // Upload SVG to R2
    const svgBuffer = Buffer.from(svg, 'utf-8')
    const svgResult = await r2.upload({
      buffer: svgBuffer,
      contentType: 'image/svg+xml',
      fileName: `diagram-${diagramId || Date.now()}.svg`,
      folder: `articles/${articleId}/diagrams`,
    })
    console.log(`✓ Uploaded SVG (${svgBuffer.length} bytes): ${svgResult.url}`)

    return NextResponse.json({
      success: true,
      url: svgResult.url,
      key: svgResult.key,
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
