// Client-side Supabase client
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    // During build time, return a dummy client to avoid breaking the build
    // The actual runtime check happens in the middleware
    if (typeof window === 'undefined') {
      // Server-side/build time - return a dummy client
      const dummyUrl = 'https://placeholder.supabase.co'
      const dummyKey = 'placeholder-key'
      return createBrowserClient<Database>(dummyUrl, dummyKey)
    }
    // Client-side runtime - this should not happen if middleware is working
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment.'
    )
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  )
}
