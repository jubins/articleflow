// Supabase Storage service for markdown files
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

export interface UploadMarkdownOptions {
  userId: string
  fileId: string
  content: string
  fileName?: string
}

export interface UploadResult {
  url: string
  path: string
}

export class StorageService {
  private supabase

  constructor(
    supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
  }

  /**
   * Upload markdown file to Supabase Storage
   */
  async uploadMarkdown(options: UploadMarkdownOptions): Promise<UploadResult> {
    try {
      const fileName = options.fileName || `${options.fileId}.md`
      const filePath = `${options.userId}/${fileName}`

      // Convert content to Blob
      const blob = new Blob([options.content], { type: 'text/markdown' })

      // Upload to Supabase Storage
      const { error } = await this.supabase.storage
        .from('articles-markdown')
        .upload(filePath, blob, {
          contentType: 'text/markdown',
          upsert: true, // Overwrite if exists
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('articles-markdown')
        .getPublicUrl(filePath)

      return {
        url: urlData.publicUrl,
        path: filePath,
      }
    } catch (error) {
      console.error('Error uploading markdown:', error)
      throw new Error(
        `Failed to upload markdown: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Download markdown file from storage
   */
  async downloadMarkdown(filePath: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from('articles-markdown')
        .download(filePath)

      if (error) {
        throw error
      }

      const text = await data.text()
      return text
    } catch (error) {
      console.error('Error downloading markdown:', error)
      throw new Error(
        `Failed to download markdown: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete markdown file from storage
   */
  async deleteMarkdown(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from('articles-markdown')
        .remove([filePath])

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting markdown:', error)
      throw new Error(
        `Failed to delete markdown: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * List all markdown files for a user
   */
  async listUserFiles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from('articles-markdown')
        .list(userId)

      if (error) {
        throw error
      }

      return data.map(file => `${userId}/${file.name}`)
    } catch (error) {
      console.error('Error listing files:', error)
      throw new Error(
        `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from('articles-markdown')
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        throw error
      }

      return data.signedUrl
    } catch (error) {
      console.error('Error creating signed URL:', error)
      throw new Error(
        `Failed to create signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

/**
 * Create a storage service instance
 */
export function createStorageService(): StorageService {
  return new StorageService()
}
