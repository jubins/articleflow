// Database type definitions for ArticleFlow

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          linkedin_handle: string | null
          twitter_handle: string | null
          github_handle: string | null
          bio: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          linkedin_handle?: string | null
          twitter_handle?: string | null
          github_handle?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          linkedin_handle?: string | null
          twitter_handle?: string | null
          github_handle?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          anthropic_api_key: string | null
          google_ai_api_key: string | null
          google_sheets_id: string | null
          default_ai_provider: 'claude' | 'gemini'
          default_word_count: number
          article_template: string | null
          google_access_token: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          google_connected: boolean
          google_connected_at: string | null
          carousel_theme: 'classic' | 'academic' | 'modern' | 'elegant' | 'professional'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          anthropic_api_key?: string | null
          google_ai_api_key?: string | null
          google_sheets_id?: string | null
          default_ai_provider?: 'claude' | 'gemini'
          default_word_count?: number
          article_template?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          google_connected?: boolean
          google_connected_at?: string | null
          carousel_theme?: 'classic' | 'academic' | 'modern'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          anthropic_api_key?: string | null
          google_ai_api_key?: string | null
          google_sheets_id?: string | null
          default_ai_provider?: 'claude' | 'gemini'
          default_word_count?: number
          article_template?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          google_connected?: boolean
          google_connected_at?: string | null
          carousel_theme?: 'classic' | 'academic' | 'modern'
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          rich_text_content: string | null
          description: string | null
          tldr: string | null
          tags: string[]
          word_count: number | null
          platform: 'medium' | 'devto' | 'dzone' | 'all'
          article_type: string
          status: 'draft' | 'generated' | 'published' | 'failed'
          ai_provider: string
          google_doc_id: string | null
          google_doc_url: string | null
          file_id: string | null
          linkedin_teaser: string | null
          generation_metadata: Json
          diagram_images: Json | null
          error_message: string | null
          generated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          rich_text_content?: string | null
          description?: string | null
          tldr?: string | null
          tags?: string[]
          word_count?: number | null
          platform: 'medium' | 'devto' | 'dzone' | 'all'
          article_type?: string
          status?: 'draft' | 'generated' | 'published' | 'failed'
          ai_provider: string
          google_doc_id?: string | null
          google_doc_url?: string | null
          file_id?: string | null
          linkedin_teaser?: string | null
          generation_metadata?: Json
          diagram_images?: Json | null
          error_message?: string | null
          generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          rich_text_content?: string | null
          description?: string | null
          tldr?: string | null
          tags?: string[]
          word_count?: number | null
          platform?: 'medium' | 'devto' | 'dzone' | 'all'
          article_type?: string
          status?: 'draft' | 'generated' | 'published' | 'failed'
          ai_provider?: string
          google_doc_id?: string | null
          google_doc_url?: string | null
          file_id?: string | null
          linkedin_teaser?: string | null
          generation_metadata?: Json
          diagram_images?: Json | null
          error_message?: string | null
          generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generation_logs: {
        Row: {
          id: string
          user_id: string
          article_id: string | null
          action: string
          status: 'started' | 'success' | 'failed'
          ai_provider: string | null
          duration_ms: number | null
          error_message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id?: string | null
          action: string
          status: 'started' | 'success' | 'failed'
          ai_provider?: string | null
          duration_ms?: number | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string | null
          action?: string
          status?: 'started' | 'success' | 'failed'
          ai_provider?: string | null
          duration_ms?: number | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
  }
}

// Helper types for easier use throughout the app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type Article = Database['public']['Tables']['articles']['Row']
export type GenerationLog = Database['public']['Tables']['generation_logs']['Row']

export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type InsertUserSettings = Database['public']['Tables']['user_settings']['Insert']
export type InsertArticle = Database['public']['Tables']['articles']['Insert']
export type InsertGenerationLog = Database['public']['Tables']['generation_logs']['Insert']

export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type UpdateUserSettings = Database['public']['Tables']['user_settings']['Update']
export type UpdateArticle = Database['public']['Tables']['articles']['Update']
export type UpdateGenerationLog = Database['public']['Tables']['generation_logs']['Update']

// Enum types for better type safety
export const AI_PROVIDERS = ['claude', 'gemini'] as const
export type AIProvider = typeof AI_PROVIDERS[number]

export const PLATFORMS = ['medium', 'devto', 'dzone', 'all'] as const
export type Platform = typeof PLATFORMS[number]

export const ARTICLE_STATUSES = ['draft', 'generated', 'published', 'failed'] as const
export type ArticleStatus = typeof ARTICLE_STATUSES[number]

export const LOG_STATUSES = ['started', 'success', 'failed'] as const
export type LogStatus = typeof LOG_STATUSES[number]
