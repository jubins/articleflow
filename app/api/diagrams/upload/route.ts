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

    const { svg, pngData, webpData, diagramId, articleId } = await request.json()

    if (!svg || !pngData || !webpData) {
      return NextResponse.json(
        { error: 'SVG, PNG, and WebP data are required' },
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

    // 1. Upload SVG (original source for debugging)
    const svgBuffer = Buffer.from(svg, 'utf-8')
    const svgResult = await r2.upload({
      buffer: svgBuffer,
      contentType: 'image/svg+xml',
      fileName: `diagram-${diagramId || Date.now()}.svg`,
      folder: `articles/${articleId}/diagrams`,
    })
    console.log(`✓ Uploaded SVG (${svgBuffer.length} bytes): ${svgResult.url}`)

    // 2. Upload PNG (client-rendered with fonts)
    const pngBase64 = pngData.replace(/^data:image\/\w+;base64,/, '')
    const pngBuffer = Buffer.from(pngBase64, 'base64')
    const pngResult = await r2.upload({
      buffer: pngBuffer,
      contentType: 'image/png',
      fileName: `diagram-${diagramId || Date.now()}.png`,
      folder: `articles/${articleId}/diagrams`,
    })
    console.log(`✓ Uploaded PNG (${pngBuffer.length} bytes): ${pngResult.url}`)

    // 3. Upload WebP (client-rendered, smaller file size)
    const webpBase64 = webpData.replace(/^data:image\/\w+;base64,/, '')
    const webpBuffer = Buffer.from(webpBase64, 'base64')
    const webpResult = await r2.upload({
      buffer: webpBuffer,
      contentType: 'image/webp',
      fileName: `diagram-${diagramId || Date.now()}.webp`,
      folder: `articles/${articleId}/diagrams`,
    })
    console.log(`✓ Uploaded WebP (${webpBuffer.length} bytes): ${webpResult.url}`)

    return NextResponse.json({
      success: true,
      url: pngResult.url, // Return PNG as primary for now (debugging)
      svgUrl: svgResult.url,
      pngUrl: pngResult.url,
      webpUrl: webpResult.url,
      key: pngResult.key,
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
