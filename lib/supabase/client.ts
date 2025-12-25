// Client-side Supabase client
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment.'
    )
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  )
}
