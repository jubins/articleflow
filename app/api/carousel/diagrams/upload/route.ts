import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { R2StorageService } from '@/lib/services/r2-storage'
import crypto from 'crypto'
import { saveDiagramToCache } from '@/lib/utils/diagram-cache'

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

    // Parse FormData
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const slideIndex = formData.get('slideIndex') as string
    const articleId = formData.get('articleId') as string
    const mermaidCode = formData.get('mermaidCode') as string

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      )
    }

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    console.log('Uploading carousel diagram as PNG. Size:', imageFile.size, 'bytes')

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const pngBuffer = Buffer.from(arrayBuffer)

    console.log('PNG buffer size:', pngBuffer.length, 'bytes')

    // Upload to R2
    const r2Service = new R2StorageService()

    // Generate unique filename using mermaidCode if available
    const hash = mermaidCode
      ? crypto.createHash('md5').update(mermaidCode).digest('hex').substring(0, 8)
      : crypto.createHash('md5').update(pngBuffer).digest('hex').substring(0, 8)
    const fileName = `carousel-diagram-${slideIndex || 0}-${hash}.png`

    console.log(`Generated filename: ${fileName}${mermaidCode ? ' (using mermaid code hash)' : ' (using image hash)'}`)

    const uploadResult = await r2Service.upload({
      buffer: pngBuffer,
      contentType: 'image/png',
      fileName,
      folder: `articles/${articleId}/diagrams`,
    })

    console.log('Uploaded diagram to R2:', uploadResult.url)

    // Save diagram URL to cache if mermaidCode is provided
    if (mermaidCode) {
      const cached = await saveDiagramToCache(articleId, mermaidCode, uploadResult.url)
      if (cached) {
        console.log('✓ Diagram URL saved to articles.diagram_images cache')
      } else {
        console.warn('⚠ Failed to save diagram URL to cache, but upload succeeded')
      }
    } else {
      console.log('ℹ No mermaid code provided, skipping cache save')
    }

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
