import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/lib/types/database'
import { processMermaidDiagrams, replaceMermaidWithImages } from '@/lib/services/diagram-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    const typedArticle = article as Article | null

    if (articleError || !typedArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check if diagrams are already cached
    const cachedDiagrams = typedArticle.diagram_images as Record<string, string> | null
    if (cachedDiagrams && Object.keys(cachedDiagrams).length > 0) {
      return NextResponse.json({
        success: true,
        diagrams: cachedDiagrams,
        content: replaceMermaidWithImages(typedArticle.content, cachedDiagrams),
        cached: true
      })
    }

    // Use shared diagram processing service
    const result = await processMermaidDiagrams(typedArticle.id, typedArticle.content)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to process diagrams'
      }, { status: 500 })
    }

    // Save cached diagrams to database
    if (Object.keys(result.diagrams).length > 0) {
      const timestamp = new Date().toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('articles')
        .update({
          diagram_images: result.diagrams,
          diagram_images_url: timestamp
        })
        .eq('id', typedArticle.id)
    }

    return NextResponse.json({
      success: true,
      diagrams: result.diagrams,
      content: result.content
    })

  } catch (error) {
    console.error('Process diagrams error:', error)
    return NextResponse.json(
      { error: 'Failed to process diagrams', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
