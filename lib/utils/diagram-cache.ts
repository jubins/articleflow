import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { Json } from '@/lib/types/database'

/**
 * Generate a unique cache key for a diagram based on its mermaid code
 */
export function generateDiagramCacheKey(mermaidCode: string): string {
  const hash = crypto.createHash('md5').update(mermaidCode).digest('hex').substring(0, 8)
  return `mermaid-${hash}`
}

/**
 * Get cached diagram URL from articles.diagram_images
 */
export async function getCachedDiagramUrl(
  articleId: string,
  mermaidCode: string
): Promise<string | null> {
  try {
    const supabase = await createClient()
    const cacheKey = generateDiagramCacheKey(mermaidCode)

    const { data, error } = await supabase
      .from('articles')
      .select('diagram_images')
      .eq('id', articleId)
      .single<{ diagram_images: Record<string, string> | null }>()

    if (error || !data) {
      console.error('Error fetching cached diagrams:', error)
      return null
    }

    const diagramImages = data.diagram_images
    if (!diagramImages) return null

    const cachedUrl = diagramImages[cacheKey]
    if (cachedUrl) {
      console.log(`✓ Found cached diagram URL for key ${cacheKey}:`, cachedUrl)
    }

    return cachedUrl || null
  } catch (error) {
    console.error('Error in getCachedDiagramUrl:', error)
    return null
  }
}

/**
 * Save diagram URL to articles.diagram_images cache
 */
export async function saveDiagramToCache(
  articleId: string,
  mermaidCode: string,
  url: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const cacheKey = generateDiagramCacheKey(mermaidCode)

    // Fetch current diagram_images
    const { data: currentData, error: fetchError } = await supabase
      .from('articles')
      .select('diagram_images')
      .eq('id', articleId)
      .single<{ diagram_images: Record<string, string> | null }>()

    if (fetchError) {
      console.error('Error fetching current diagram_images:', fetchError)
      return false
    }

    // Merge with existing diagram_images
    const currentImages = currentData?.diagram_images || {}
    const updatedImages = {
      ...currentImages,
      [cacheKey]: url,
    }

    // Update articles table with new diagram URL
    const { error: updateError } = await supabase
      .from('articles')
      // @ts-expect-error: Supabase type inference limitation with JSONB fields
      .update({ diagram_images: updatedImages as Json })
      .eq('id', articleId)

    if (updateError) {
      console.error('Error updating diagram_images:', updateError)
      return false
    }

    console.log(`✓ Saved diagram to cache: ${cacheKey} -> ${url}`)
    return true
  } catch (error) {
    console.error('Error in saveDiagramToCache:', error)
    return false
  }
}

/**
 * Get all cached diagram URLs for an article
 */
export async function getAllCachedDiagrams(
  articleId: string
): Promise<Record<string, string>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('articles')
      .select('diagram_images')
      .eq('id', articleId)
      .single<{ diagram_images: Record<string, string> | null }>()

    if (error || !data) {
      console.error('Error fetching all cached diagrams:', error)
      return {}
    }

    return data.diagram_images || {}
  } catch (error) {
    console.error('Error in getAllCachedDiagrams:', error)
    return {}
  }
}
