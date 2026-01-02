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

    const { imageData, diagramId, articleId } = await request.json()

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const pngBuffer = Buffer.from(base64Data, 'base64')

    console.log(`Received PNG buffer of size: ${pngBuffer.length} bytes`)

    // Upload PNG to R2
    const r2 = new R2StorageService()
    const pngResult = await r2.upload({
      buffer: pngBuffer,
      contentType: 'image/png',
      fileName: `diagram-${diagramId || Date.now()}.png`,
      folder: `articles/${articleId}/diagrams`,
    })

    console.log(`Uploaded PNG to: ${pngResult.url}`)

    return NextResponse.json({
      success: true,
      url: pngResult.url,
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
